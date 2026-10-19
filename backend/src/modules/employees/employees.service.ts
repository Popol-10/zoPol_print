import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeSummaryDto } from './dto/employee-summary.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<EmployeeSummaryDto[]> {
    const employees = await this.employeesRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
    return employees.map((employee) => this.toSummary(employee));
  }

  async create(actor: AuthenticatedUser, dto: CreateEmployeeDto): Promise<EmployeeSummaryDto> {
    const employee = await this.employeesRepository.save(
      this.employeesRepository.create({ ...dto, organizationId: actor.organizationId }),
    );
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.EMPLOYEE_CREATED,
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      metadata: { position: employee.position },
    });
    return this.toSummary(employee);
  }

  async update(
    actor: AuthenticatedUser,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeSummaryDto> {
    const employee = await this.findForOrganization(actor.organizationId, employeeId);
    const updates = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Indiquez au moins une modification.');
    }
    Object.assign(employee, updates);
    const updated = await this.employeesRepository.save(employee);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.EMPLOYEE_UPDATED,
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      metadata: { fields: Object.keys(updates) },
    });
    return this.toSummary(updated);
  }

  async archive(actor: AuthenticatedUser, employeeId: string): Promise<void> {
    const employee = await this.findForOrganization(actor.organizationId, employeeId);
    await this.employeesRepository.softRemove(employee);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.EMPLOYEE_ARCHIVED,
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      metadata: { position: employee.position },
    });
  }

  private async findForOrganization(organizationId: string, employeeId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employé introuvable.');
    return employee;
  }

  private toSummary(employee: Employee): EmployeeSummaryDto {
    return {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      phone: employee.phone,
      email: employee.email,
      status: employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
