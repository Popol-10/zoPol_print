import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Employee } from '../employees/entities/employee.entity';
import { AttendanceSummaryDto } from './dto/attendance-summary.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceStatus } from './entities/attendance-status.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly auditService: AuditService,
  ) {}

  async findDaily(organizationId: string, date: string): Promise<AttendanceSummaryDto[]> {
    this.validateDate(date);
    const [employees, records] = await Promise.all([
      this.employeesRepository.find({ where: { organizationId }, order: { name: 'ASC' } }),
      this.attendanceRepository.find({ where: { organizationId, attendanceDate: date } }),
    ]);
    const recordByEmployee = new Map(records.map((record) => [record.employeeId, record]));
    return employees.map((employee) =>
      this.toSummary(employee, recordByEmployee.get(employee.id) ?? null, date),
    );
  }

  async upsert(
    actor: AuthenticatedUser,
    employeeId: string,
    dto: UpsertAttendanceDto,
  ): Promise<AttendanceSummaryDto> {
    this.validateDate(dto.date);
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId, organizationId: actor.organizationId },
    });
    if (!employee) throw new NotFoundException('Employé introuvable.');

    const checkIn = this.normalizeTime(dto.checkIn);
    const checkOut = this.normalizeTime(dto.checkOut);
    this.validateTimes(dto.status, checkIn, checkOut);

    const existing = await this.attendanceRepository.findOne({
      where: { organizationId: actor.organizationId, employeeId, attendanceDate: dto.date },
    });
    const previous = existing?.status ?? null;
    const record = this.attendanceRepository.create({
      ...(existing ?? {}),
      organizationId: actor.organizationId,
      employeeId,
      employee,
      attendanceDate: dto.date,
      status: dto.status,
      checkIn,
      checkOut,
    });
    const saved = await this.attendanceRepository.save(record);

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.ATTENDANCE_RECORDED,
      entityType: 'ATTENDANCE_RECORD',
      entityId: saved.id,
      metadata: {
        employeeId,
        date: dto.date,
        status: dto.status,
        previousStatus: previous,
        checkIn,
        checkOut,
      },
    });
    return this.toSummary(employee, saved, dto.date);
  }

  private validateDate(value: string): void {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('La date doit être une journée valide au format AAAA-MM-JJ.');
    }
  }

  private validateTimes(status: AttendanceStatus, checkIn: string | null, checkOut: string | null): void {
    const requiresClockIn = status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
    if (requiresClockIn && !checkIn) {
      throw new BadRequestException('Une heure d’arrivée est requise pour un employé présent ou en retard.');
    }
    if (!requiresClockIn && (checkIn || checkOut)) {
      throw new BadRequestException('Un employé absent ou en congé ne peut pas avoir d’heures de pointage.');
    }
    if (checkOut && !checkIn) {
      throw new BadRequestException('L’heure de sortie nécessite une heure d’arrivée.');
    }
    if (checkIn && checkOut && this.toMinutes(checkOut) <= this.toMinutes(checkIn)) {
      throw new BadRequestException('L’heure de sortie doit être postérieure à l’heure d’arrivée.');
    }
  }

  private normalizeTime(value?: string | null): string | null {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private toSummary(employee: Employee, record: AttendanceRecord | null, date: string): AttendanceSummaryDto {
    const workedMinutes =
      record?.checkIn && record.checkOut
        ? this.toMinutes(record.checkOut) - this.toMinutes(record.checkIn)
        : null;
    return {
      id: record?.id ?? null,
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      employeeStatus: employee.status,
      date,
      status: record?.status ?? 'NOT_RECORDED',
      checkIn: record?.checkIn ?? null,
      checkOut: record?.checkOut ?? null,
      workedMinutes,
    };
  }
}
