import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeStatus } from '../employees/entities/employee-status.enum';
import { CompensationSummaryDto } from './dto/compensation-summary.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { EmployeeCompensation } from './entities/employee-compensation.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(EmployeeCompensation)
    private readonly compensationRepository: Repository<EmployeeCompensation>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<CompensationSummaryDto[]> {
    const [employees, compensationRows] = await Promise.all([
      this.employeesRepository.find({
        where: { organizationId },
        order: { name: 'ASC' },
      }),
      this.compensationRepository.find({ where: { organizationId } }),
    ]);
    const compensationByEmployee = new Map(compensationRows.map((row) => [row.employeeId, row]));
    return employees.map((employee) => {
      const compensation = compensationByEmployee.get(employee.id);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        position: employee.position,
        employeeStatus: employee.status,
        monthlyBaseSalary: compensation?.monthlyBaseSalary ?? null,
        effectiveFrom: compensation?.effectiveFrom ?? null,
      };
    });
  }

  async setCompensation(
    actor: AuthenticatedUser,
    employeeId: string,
    dto: UpdateCompensationDto,
  ): Promise<CompensationSummaryDto> {
    const employee = await this.employeesRepository.findOne({
      where: {
        id: employeeId,
        organizationId: actor.organizationId,
        status: EmployeeStatus.ACTIVE,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employé actif introuvable dans cet atelier.');
    }

    const existing = await this.compensationRepository.findOne({
      where: { organizationId: actor.organizationId, employeeId },
    });
    const previousSalary = existing?.monthlyBaseSalary ?? null;
    const compensation = await this.compensationRepository.save(
      this.compensationRepository.create({
        ...(existing ?? {}),
        organizationId: actor.organizationId,
        employeeId,
        employee,
        monthlyBaseSalary: dto.monthlyBaseSalary,
        effectiveFrom: dto.effectiveFrom,
      }),
    );
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.PAYROLL_COMPENSATION_UPDATED,
      entityType: 'EMPLOYEE_COMPENSATION',
      entityId: compensation.id,
      metadata: {
        employeeId,
        previousMonthlyBaseSalary: previousSalary,
        monthlyBaseSalary: compensation.monthlyBaseSalary,
        effectiveFrom: compensation.effectiveFrom,
      },
    });
    return {
      employeeId,
      employeeName: employee.name,
      position: employee.position,
      employeeStatus: employee.status,
      monthlyBaseSalary: compensation.monthlyBaseSalary,
      effectiveFrom: compensation.effectiveFrom,
    };
  }
}
