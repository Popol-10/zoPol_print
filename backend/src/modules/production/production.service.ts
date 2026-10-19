import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeStatus } from '../employees/entities/employee-status.enum';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { OrderSummaryDto } from '../orders/dto/order-summary.dto';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { AssignProductionTaskDto } from './dto/assign-production-task.dto';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { ProductionTaskSummaryDto } from './dto/production-task-summary.dto';
import { UpdateProductionStageDto } from './dto/update-production-stage.dto';
import { ProductionTaskScheduleDto } from './dto/production-task-schedule.dto';
import { ProductionTask } from './entities/production-task.entity';
import { ProductionTaskStage } from './entities/production-task-stage.enum';

const stages = Object.values(ProductionTaskStage);

interface ProductionSchedule {
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
}

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionTask)
    private readonly tasksRepository: Repository<ProductionTask>,
    @InjectRepository(SalesOrder)
    private readonly ordersRepository: Repository<SalesOrder>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<ProductionTaskSummaryDto[]> {
    const tasks = await this.tasksRepository.find({
      where: { organizationId },
      relations: { order: true, employee: true },
      order: { createdAt: 'ASC' },
    });
    return tasks.map((task) => this.toSummary(task));
  }

  async findAvailableOrders(organizationId: string): Promise<OrderSummaryDto[]> {
    const orders = await this.ordersRepository.find({
      where: {
        organizationId,
        status: In([OrderStatus.CONFIRMED, OrderStatus.TO_PRODUCE]),
      },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
    const assignedOrderIds = new Set(
      (
        await this.tasksRepository.find({
          where: { organizationId },
          select: { orderId: true },
        })
      ).map((task) => task.orderId),
    );
    return orders
      .filter((order) => !assignedOrderIds.has(order.id))
      .map((order) => this.toOrderSummary(order));
  }

  async createTask(
    actor: AuthenticatedUser,
    dto: CreateProductionTaskDto,
  ): Promise<ProductionTaskSummaryDto> {
    const schedule = this.parseSchedule(dto);
    let saved: ProductionTask;
    let previousOrderStatus = OrderStatus.CONFIRMED;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        await this.lockScheduleChanges(manager, actor.organizationId);
        const orders = manager.getRepository(SalesOrder);
        const tasks = manager.getRepository(ProductionTask);
        const order = await orders.findOne({
          where: { id: dto.orderId, organizationId: actor.organizationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!order) throw new NotFoundException('Commande introuvable.');
        if (![OrderStatus.CONFIRMED, OrderStatus.TO_PRODUCE].includes(order.status)) {
          throw new BadRequestException('Seules les commandes confirmées peuvent être planifiées.');
        }
        previousOrderStatus = order.status;
        const existing = await tasks.findOne({ where: { orderId: order.id } });
        if (existing) throw new ConflictException('Cette commande est déjà planifiée.');
        if (schedule) {
          await this.assertScheduleAvailable(tasks, actor.organizationId, order.machine, schedule);
        }

        order.status = OrderStatus.TO_PRODUCE;
        await orders.save(order);
        return tasks.save(
          tasks.create({
            organizationId: actor.organizationId,
            orderId: order.id,
            order,
            operatorName: order.operatorName,
            stage: ProductionTaskStage.TO_PRODUCE,
            scheduledDate: schedule?.scheduledDate ?? null,
            scheduledStartTime: schedule?.scheduledStartTime ?? null,
            scheduledEndTime: schedule?.scheduledEndTime ?? null,
          }),
        );
      });
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Cette commande est déjà planifiée.');
      }
      throw error;
    }

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.PRODUCTION_TASK_CREATED,
      entityType: 'PRODUCTION_TASK',
      entityId: saved.id,
      metadata: { orderId: saved.orderId },
    });
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.ORDER_STATUS_UPDATED,
      entityType: 'ORDER',
      entityId: saved.orderId,
      metadata: { from: previousOrderStatus, to: OrderStatus.TO_PRODUCE, source: 'production-planning' },
    });
    return this.toSummary(saved);
  }

  async assignTask(
    actor: AuthenticatedUser,
    taskId: string,
    dto: AssignProductionTaskDto,
  ): Promise<ProductionTaskSummaryDto> {
    if (dto.employeeId === undefined) {
      throw new BadRequestException('Choisissez un employé ou désaffectez explicitement la tâche.');
    }
    const result = await this.dataSource.transaction(async (manager) => {
      await this.lockScheduleChanges(manager, actor.organizationId);
      const tasks = manager.getRepository(ProductionTask);
      const orders = manager.getRepository(SalesOrder);
      const employees = manager.getRepository(Employee);
      const task = await tasks.findOne({
        where: { id: taskId, organizationId: actor.organizationId },
        relations: { order: true, employee: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) throw new NotFoundException('Tâche de production introuvable.');

      const previousEmployeeId = task.employeeId;
      const previousOperatorName = task.operatorName;
      let employee: Employee | null = null;
      if (dto.employeeId !== null) {
        employee = await employees.findOne({
          where: {
            id: dto.employeeId,
            organizationId: actor.organizationId,
            status: EmployeeStatus.ACTIVE,
          },
        });
        if (!employee) throw new NotFoundException('Employé actif introuvable dans cet atelier.');
        const currentSchedule = this.taskSchedule(task);
        if (currentSchedule) {
          await this.assertScheduleAvailable(
            tasks,
            actor.organizationId,
            task.order.machine,
            currentSchedule,
            task.id,
            employee.id,
          );
        }
      }

      task.employeeId = employee?.id ?? null;
      task.employee = employee;
      task.operatorName = employee?.name ?? 'À attribuer';
      task.order.operatorName = task.operatorName;
      await orders.save(task.order);
      const saved = await tasks.save(task);
      return { task: saved, previousEmployeeId, previousOperatorName };
    });
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.PRODUCTION_TASK_ASSIGNED,
      entityType: 'PRODUCTION_TASK',
      entityId: result.task.id,
      metadata: {
        fromEmployeeId: result.previousEmployeeId,
        fromName: result.previousOperatorName,
        toEmployeeId: result.task.employeeId,
        toName: result.task.operatorName,
      },
    });
    return this.toSummary(result.task);
  }

  async updateSchedule(
    actor: AuthenticatedUser,
    taskId: string,
    dto: ProductionTaskScheduleDto,
  ): Promise<ProductionTaskSummaryDto> {
    if (
      dto.scheduledDate === undefined ||
      dto.scheduledStartTime === undefined ||
      dto.scheduledEndTime === undefined
    ) {
      throw new BadRequestException(
        'Envoyez les trois champs du créneau, avec null pour chacun afin de le retirer.',
      );
    }
    const schedule = this.parseSchedule(dto);
    const result = await this.dataSource.transaction(async (manager) => {
      await this.lockScheduleChanges(manager, actor.organizationId);
      const tasks = manager.getRepository(ProductionTask);
      const task = await tasks.findOne({
        where: { id: taskId, organizationId: actor.organizationId },
        relations: { order: true, employee: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) throw new NotFoundException('Tâche de production introuvable.');
      if (task.stage === ProductionTaskStage.COMPLETED) {
        throw new BadRequestException('Le créneau d’une tâche terminée ne peut pas être modifié.');
      }

      const previousSchedule = this.taskSchedule(task);
      if (schedule) {
        await this.assertScheduleAvailable(
          tasks,
          actor.organizationId,
          task.order.machine,
          schedule,
          task.id,
          task.employeeId,
        );
      }
      if (this.sameSchedule(previousSchedule, schedule)) return { task, changed: false, previousSchedule };

      task.scheduledDate = schedule?.scheduledDate ?? null;
      task.scheduledStartTime = schedule?.scheduledStartTime ?? null;
      task.scheduledEndTime = schedule?.scheduledEndTime ?? null;
      return { task: await tasks.save(task), changed: true, previousSchedule };
    });

    if (result.changed) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCTION_SCHEDULE_UPDATED,
        entityType: 'PRODUCTION_TASK',
        entityId: result.task.id,
        metadata: {
          orderId: result.task.orderId,
          from: result.previousSchedule,
          scheduledDate: result.task.scheduledDate,
          startTime: result.task.scheduledStartTime,
          endTime: result.task.scheduledEndTime,
        },
      });
    }
    return this.toSummary(result.task);
  }

  async updateStage(
    actor: AuthenticatedUser,
    taskId: string,
    dto: UpdateProductionStageDto,
  ): Promise<ProductionTaskSummaryDto> {
    const result = await this.dataSource.transaction(async (manager) => {
      const tasks = manager.getRepository(ProductionTask);
      const orders = manager.getRepository(SalesOrder);
      const task = await tasks.findOne({
        where: { id: taskId, organizationId: actor.organizationId },
        relations: { order: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) throw new NotFoundException('Tâche de production introuvable.');
      const currentIndex = stages.indexOf(task.stage);
      const nextIndex = stages.indexOf(dto.stage);
      if (nextIndex === currentIndex) return { task, from: task.stage };
      if (nextIndex !== currentIndex + 1) {
        throw new BadRequestException('La tâche doit avancer vers l’étape suivante.');
      }

      const previousStage = task.stage;
      task.stage = dto.stage;
      task.order.status = this.toOrderStatus(dto.stage);
      await orders.save(task.order);
      await tasks.save(task);
      return { task, from: previousStage };
    });

    if (result.from !== dto.stage) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCTION_STAGE_UPDATED,
        entityType: 'PRODUCTION_TASK',
        entityId: result.task.id,
        metadata: { from: result.from, to: result.task.stage },
      });
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.ORDER_STATUS_UPDATED,
        entityType: 'ORDER',
        entityId: result.task.orderId,
        metadata: { from: this.toOrderStatus(result.from), to: result.task.order.status },
      });
    }
    return this.toSummary(result.task);
  }

  private toOrderStatus(stage: ProductionTaskStage): OrderStatus {
    switch (stage) {
      case ProductionTaskStage.TO_PRODUCE:
        return OrderStatus.TO_PRODUCE;
      case ProductionTaskStage.IN_PRODUCTION:
        return OrderStatus.IN_PRODUCTION;
      case ProductionTaskStage.QUALITY_CONTROL:
        return OrderStatus.QUALITY_CONTROL;
      case ProductionTaskStage.COMPLETED:
        return OrderStatus.COMPLETED;
    }
  }

  private toSummary(task: ProductionTask): ProductionTaskSummaryDto {
    const order = task.order;
    if (!order) throw new NotFoundException('Commande liée à la tâche introuvable.');
    return {
      id: task.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: order.clientCompany || order.clientName,
      product: order.productName,
      quantity: order.quantity,
      machine: order.machine,
      employeeId: task.employeeId ?? null,
      operatorName: task.employee?.name ?? task.operatorName,
      priority: order.priority,
      dueDate: order.dueDate,
      scheduledDate: task.scheduledDate,
      scheduledStartTime: task.scheduledStartTime?.slice(0, 5) ?? null,
      scheduledEndTime: task.scheduledEndTime?.slice(0, 5) ?? null,
      stage: task.stage,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private parseSchedule(dto: ProductionTaskScheduleDto): ProductionSchedule | null {
    const hasNoScheduleFields =
      dto.scheduledDate === undefined &&
      dto.scheduledStartTime === undefined &&
      dto.scheduledEndTime === undefined;
    if (hasNoScheduleFields) return null;
    if (
      dto.scheduledDate === undefined ||
      dto.scheduledStartTime === undefined ||
      dto.scheduledEndTime === undefined
    ) {
      throw new BadRequestException('Envoyez ensemble la date et les heures de début et de fin.');
    }
    const scheduledDate = dto.scheduledDate ?? null;
    const startTime = dto.scheduledStartTime ?? null;
    const endTime = dto.scheduledEndTime ?? null;
    if (scheduledDate === null && startTime === null && endTime === null) return null;
    if (scheduledDate === null || startTime === null || endTime === null) {
      throw new BadRequestException(
        'Le créneau doit contenir une date, une heure de début et une heure de fin.',
      );
    }
    if (startTime >= endTime) {
      throw new BadRequestException('L’heure de fin doit être postérieure à l’heure de début.');
    }
    return {
      scheduledDate,
      scheduledStartTime: `${startTime}:00`,
      scheduledEndTime: `${endTime}:00`,
    };
  }

  private taskSchedule(task: ProductionTask): ProductionSchedule | null {
    if (!task.scheduledDate || !task.scheduledStartTime || !task.scheduledEndTime) return null;
    return {
      scheduledDate: task.scheduledDate,
      scheduledStartTime: task.scheduledStartTime,
      scheduledEndTime: task.scheduledEndTime,
    };
  }

  private sameSchedule(left: ProductionSchedule | null, right: ProductionSchedule | null): boolean {
    return (
      left?.scheduledDate === right?.scheduledDate &&
      left?.scheduledStartTime === right?.scheduledStartTime &&
      left?.scheduledEndTime === right?.scheduledEndTime
    );
  }

  private async lockScheduleChanges(manager: EntityManager, organizationId: string): Promise<void> {
    const organization = await manager.getRepository(Organization).findOne({
      where: { id: organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!organization) throw new NotFoundException('Organisation introuvable.');
  }

  private async assertScheduleAvailable(
    tasks: Repository<ProductionTask>,
    organizationId: string,
    machine: string,
    schedule: ProductionSchedule,
    excludeTaskId?: string,
    employeeId?: string | null,
  ): Promise<void> {
    const query = tasks
      .createQueryBuilder('task')
      .innerJoin('task.order', 'salesOrder')
      .where('task.organizationId = :organizationId', { organizationId })
      .andWhere('task.scheduledDate = :scheduledDate', { scheduledDate: schedule.scheduledDate })
      .andWhere('task.scheduledStartTime < :scheduledEndTime', {
        scheduledEndTime: schedule.scheduledEndTime,
      })
      .andWhere('task.scheduledEndTime > :scheduledStartTime', {
        scheduledStartTime: schedule.scheduledStartTime,
      })
      .andWhere('task.stage != :completedStage', { completedStage: ProductionTaskStage.COMPLETED });
    if (excludeTaskId) query.andWhere('task.id != :excludeTaskId', { excludeTaskId });
    query.andWhere(
      new Brackets((where) => {
        where.where('salesOrder.machine = :machine', { machine });
        if (employeeId) where.orWhere('task.employeeId = :employeeId', { employeeId });
      }),
    );
    if (await query.getOne()) {
      throw new ConflictException('Ce créneau chevauche une autre tâche pour cette machine ou cet employé.');
    }
  }

  private toOrderSummary(order: SalesOrder): OrderSummaryDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      clientCompany: order.clientCompany,
      productId: order.productId,
      productName: order.productName,
      productReference: order.productReference,
      machine: order.machine,
      quantity: order.quantity,
      unitPrice: Number(order.unitPrice),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      status: order.status,
      priority: order.priority,
      orderedAt: order.orderedAt,
      dueDate: order.dueDate,
      operatorName: order.operatorName,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private isDuplicateEntry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as { code?: unknown; driverError?: { code?: unknown } };
    return value.code === 'ER_DUP_ENTRY' || value.driverError?.code === 'ER_DUP_ENTRY';
  }
}
