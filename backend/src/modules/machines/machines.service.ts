import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MachineSummaryDto } from './dto/machine-summary.dto';
import { MaintenanceSummaryDto } from './dto/maintenance-summary.dto';
import { UpdateMachineStatusDto } from './dto/update-machine-status.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { Machine } from './entities/machine.entity';
import { MachineStatus } from './entities/machine-status.enum';
import { MaintenanceStatus } from './entities/maintenance-status.enum';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private readonly machinesRepository: Repository<Machine>,
    @InjectRepository(MachineMaintenance)
    private readonly maintenanceRepository: Repository<MachineMaintenance>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<MachineSummaryDto[]> {
    const [machines, maintenance] = await Promise.all([
      this.machinesRepository.find({
        where: { organizationId },
        order: { name: 'ASC' },
      }),
      this.maintenanceRepository.find({
        where: {
          organizationId,
          status: In([MaintenanceStatus.PLANNED, MaintenanceStatus.IN_PROGRESS]),
        },
        order: { scheduledFor: 'ASC' },
      }),
    ]);
    const nextByMachine = new Map<string, string>();
    for (const item of maintenance) {
      if (!nextByMachine.has(item.machineId)) {
        nextByMachine.set(item.machineId, item.scheduledFor);
      }
    }
    return machines.map((machine) => this.toMachineSummary(machine, nextByMachine.get(machine.id) ?? null));
  }

  async findMaintenance(organizationId: string): Promise<MaintenanceSummaryDto[]> {
    const records = await this.maintenanceRepository.find({
      where: { organizationId },
      relations: { machine: true },
      order: { scheduledFor: 'ASC', createdAt: 'ASC' },
    });
    return records.map((record) => this.toMaintenanceSummary(record));
  }

  async create(actor: AuthenticatedUser, dto: CreateMachineDto): Promise<MachineSummaryDto> {
    try {
      const machine = await this.machinesRepository.save(
        this.machinesRepository.create({
          organizationId: actor.organizationId,
          name: dto.name,
          type: dto.type,
          status: MachineStatus.ACTIVE,
        }),
      );
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.MACHINE_CREATED,
        entityType: 'MACHINE',
        entityId: machine.id,
        metadata: { name: machine.name, type: machine.type },
      });
      return this.toMachineSummary(machine, null);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Une machine porte déjà ce nom dans cet atelier.');
      }
      throw error;
    }
  }

  async updateStatus(
    actor: AuthenticatedUser,
    machineId: string,
    dto: UpdateMachineStatusDto,
  ): Promise<MachineSummaryDto> {
    const machine = await this.findMachine(actor.organizationId, machineId);
    if (machine.status === dto.status) {
      return this.toMachineSummary(machine, await this.nextMaintenanceDate(actor.organizationId, machine.id));
    }
    const previousStatus = machine.status;
    machine.status = dto.status;
    const updated = await this.machinesRepository.save(machine);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.MACHINE_UPDATED,
      entityType: 'MACHINE',
      entityId: updated.id,
      metadata: { from: previousStatus, to: updated.status },
    });
    return this.toMachineSummary(updated, await this.nextMaintenanceDate(actor.organizationId, updated.id));
  }

  async createMaintenance(
    actor: AuthenticatedUser,
    dto: CreateMaintenanceDto,
  ): Promise<MaintenanceSummaryDto> {
    const machine = await this.findMachine(actor.organizationId, dto.machineId);
    const record = await this.maintenanceRepository.save(
      this.maintenanceRepository.create({
        organizationId: actor.organizationId,
        machineId: machine.id,
        machine,
        scheduledFor: dto.scheduledFor,
        kind: dto.kind,
        status: MaintenanceStatus.PLANNED,
        description: dto.description,
        previousMachineStatus: null,
        completedAt: null,
      }),
    );
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.MAINTENANCE_SCHEDULED,
      entityType: 'MACHINE_MAINTENANCE',
      entityId: record.id,
      metadata: { machineId: machine.id, scheduledFor: record.scheduledFor, kind: record.kind },
    });
    return this.toMaintenanceSummary(record);
  }

  async updateMaintenanceStatus(
    actor: AuthenticatedUser,
    maintenanceId: string,
    dto: UpdateMaintenanceStatusDto,
  ): Promise<MaintenanceSummaryDto> {
    const result = await this.dataSource.transaction(async (manager) => {
      const records = manager.getRepository(MachineMaintenance);
      const machines = manager.getRepository(Machine);
      const record = await records.findOne({
        where: { id: maintenanceId, organizationId: actor.organizationId },
        relations: { machine: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!record) throw new NotFoundException('Intervention de maintenance introuvable.');
      const previousStatus = record.status;
      if (previousStatus === dto.status) return { record, previousStatus, changed: false };
      const allowed =
        previousStatus === MaintenanceStatus.PLANNED
          ? [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]
          : previousStatus === MaintenanceStatus.IN_PROGRESS
            ? [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]
            : [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException('Cette intervention est déjà terminée ou annulée.');
      }

      if (dto.status === MaintenanceStatus.IN_PROGRESS) {
        record.previousMachineStatus = record.machine.status;
        record.machine.status = MachineStatus.MAINTENANCE;
        await machines.save(record.machine);
      } else if (
        previousStatus === MaintenanceStatus.IN_PROGRESS &&
        record.machine.status === MachineStatus.MAINTENANCE
      ) {
        record.machine.status = record.previousMachineStatus ?? MachineStatus.ACTIVE;
        await machines.save(record.machine);
        record.previousMachineStatus = null;
      }
      record.status = dto.status;
      record.completedAt = dto.status === MaintenanceStatus.COMPLETED ? new Date() : null;
      const saved = await records.save(record);
      return { record: saved, previousStatus, changed: true };
    });
    if (result.changed) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.MAINTENANCE_UPDATED,
        entityType: 'MACHINE_MAINTENANCE',
        entityId: result.record.id,
        metadata: { from: result.previousStatus, to: result.record.status },
      });
    }
    return this.toMaintenanceSummary(result.record);
  }

  private async findMachine(organizationId: string, machineId: string): Promise<Machine> {
    const machine = await this.machinesRepository.findOne({
      where: { id: machineId, organizationId },
    });
    if (!machine) throw new NotFoundException('Machine introuvable.');
    return machine;
  }

  private async nextMaintenanceDate(organizationId: string, machineId: string): Promise<string | null> {
    const next = await this.maintenanceRepository.findOne({
      where: {
        organizationId,
        machineId,
        status: In([MaintenanceStatus.PLANNED, MaintenanceStatus.IN_PROGRESS]),
      },
      order: { scheduledFor: 'ASC' },
    });
    return next?.scheduledFor ?? null;
  }

  private toMachineSummary(machine: Machine, nextMaintenanceAt: string | null): MachineSummaryDto {
    return {
      id: machine.id,
      name: machine.name,
      type: machine.type,
      status: machine.status,
      nextMaintenanceAt,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
    };
  }

  private toMaintenanceSummary(record: MachineMaintenance): MaintenanceSummaryDto {
    return {
      id: record.id,
      machineId: record.machineId,
      machineName: record.machine?.name ?? '',
      scheduledFor: record.scheduledFor,
      kind: record.kind,
      status: record.status,
      description: record.description,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
