import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeStatus } from '../employees/entities/employee-status.enum';
import { CreateEmployeeTaskDto } from './dto/create-employee-task.dto';
import { EmployeeTaskSummaryDto } from './dto/employee-task-summary.dto';
import { UpdateEmployeeTaskDto } from './dto/update-employee-task.dto';
import { EmployeeTask } from './entities/employee-task.entity';
import { EmployeeTaskStatus } from './entities/employee-task-status.enum';

@Injectable()
export class HrTasksService {
  constructor(
    @InjectRepository(EmployeeTask)
    private readonly tasksRepository: Repository<EmployeeTask>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<EmployeeTaskSummaryDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { organizationId },
      relations: { employee: true },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
    return tasks.map((task) => this.toSummary(task));
  }

  async create(actor: AuthenticatedUser, dto: CreateEmployeeTaskDto): Promise<EmployeeTaskSummaryDto> {
    const employee = await this.getAssignee(actor.organizationId, dto.employeeId);
    const task = await this.tasksRepository.save(
      this.tasksRepository.create({
        organizationId: actor.organizationId,
        employeeId: employee?.id ?? null,
        employee,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate,
        status: EmployeeTaskStatus.TODO,
      }),
    );
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.HR_TASK_CREATED,
      entityType: 'EMPLOYEE_TASK',
      entityId: task.id,
      metadata: { employeeId: task.employeeId, dueDate: task.dueDate },
    });
    return this.toSummary(task);
  }

  async update(
    actor: AuthenticatedUser,
    taskId: string,
    dto: UpdateEmployeeTaskDto,
  ): Promise<EmployeeTaskSummaryDto> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, organizationId: actor.organizationId },
      relations: { employee: true },
    });
    if (!task) throw new NotFoundException('Tâche RH introuvable.');

    const previous = { employeeId: task.employeeId, status: task.status, dueDate: task.dueDate };
    if (dto.employeeId !== undefined) {
      const employee = await this.getAssignee(actor.organizationId, dto.employeeId);
      task.employeeId = employee?.id ?? null;
      task.employee = employee;
    }
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    if (dto.status !== undefined) task.status = dto.status;

    const saved = await this.tasksRepository.save(task);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.HR_TASK_UPDATED,
      entityType: 'EMPLOYEE_TASK',
      entityId: saved.id,
      metadata: {
        previous,
        current: { employeeId: saved.employeeId, status: saved.status, dueDate: saved.dueDate },
      },
    });
    return this.toSummary(saved);
  }

  async archive(actor: AuthenticatedUser, taskId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, organizationId: actor.organizationId },
    });
    if (!task) throw new NotFoundException('Tâche RH introuvable.');
    await this.tasksRepository.softRemove(task);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.HR_TASK_ARCHIVED,
      entityType: 'EMPLOYEE_TASK',
      entityId: task.id,
      metadata: { title: task.title },
    });
  }

  private async getAssignee(
    organizationId: string,
    employeeId: string | null | undefined,
  ): Promise<Employee | null> {
    if (!employeeId) return null;
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId, organizationId, status: EmployeeStatus.ACTIVE },
    });
    if (!employee) throw new NotFoundException('Employé actif introuvable dans cet atelier.');
    return employee;
  }

  private toSummary(task: EmployeeTask): EmployeeTaskSummaryDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      employeeId: task.employeeId,
      employeeName: task.employee?.name ?? null,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
