import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Client } from '../clients/entities/client.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SalesOrder } from './entities/sales-order.entity';
import { OrderStatus } from './entities/order-status.enum';
import { ProductionTask } from '../production/entities/production-task.entity';
import { ProductionTaskStage } from '../production/entities/production-task-stage.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly ordersRepository: Repository<SalesOrder>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<OrderSummaryDto[]> {
    const orders = await this.ordersRepository.find({
      where: { organizationId },
      order: { orderedAt: 'DESC', createdAt: 'DESC' },
    });
    return orders.map((order) => this.toSummary(order));
  }

  async create(actor: AuthenticatedUser, dto: CreateOrderDto): Promise<OrderSummaryDto> {
    const [client, product] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: dto.clientId, organizationId: actor.organizationId },
      }),
      this.productsRepository.findOne({
        where: { id: dto.productId, organizationId: actor.organizationId },
      }),
    ]);
    if (!client) throw new NotFoundException('Client introuvable.');
    if (!product) throw new NotFoundException('Produit introuvable.');

    const total = Number((product.price * dto.quantity).toFixed(2));
    if (!Number.isFinite(total) || total > 999999999999.99) {
      throw new BadRequestException('Le montant total de la commande dépasse la limite autorisée.');
    }
    const orderedAt = new Date();
    const order: SalesOrder = Object.assign(new SalesOrder(), {
      organizationId: actor.organizationId,
      orderNumber: `CMD-${orderedAt.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      clientId: client.id,
      client,
      clientName: client.name,
      clientCompany: client.company,
      productId: product.id,
      product,
      productName: product.name,
      productReference: product.reference,
      machine: product.machine,
      quantity: dto.quantity,
      unitPrice: product.price,
      total,
      paidAmount: 0,
      status: OrderStatus.NEW,
      priority: dto.priority,
      orderedAt,
      dueDate: dto.dueDate ?? null,
      operatorName: 'À attribuer',
    });
    const saved = await this.ordersRepository.save(order);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.ORDER_CREATED,
      entityType: 'ORDER',
      entityId: saved.id,
      metadata: {
        orderNumber: saved.orderNumber,
        clientId: saved.clientId,
        productId: saved.productId,
        total: saved.total,
      },
    });
    return this.toSummary(saved);
  }

  async updateStatus(
    actor: AuthenticatedUser,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderSummaryDto> {
    const result = await this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(SalesOrder);
      const tasks = manager.getRepository(ProductionTask);
      const order = await orders.findOne({
        where: { id: orderId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Commande introuvable.');
      const previousStatus = order.status;
      const changed = order.status !== dto.status;
      if (changed) {
        order.status = dto.status;
        await orders.save(order);
      }

      const targetStage = this.toProductionStage(dto.status);
      let task = await tasks.findOne({ where: { orderId: order.id } });
      let taskCreated = false;
      let previousTaskStage: ProductionTaskStage | null = null;
      const shouldCreateTask = [
        OrderStatus.TO_PRODUCE,
        OrderStatus.IN_PRODUCTION,
        OrderStatus.QUALITY_CONTROL,
      ].includes(dto.status);
      if (!task && targetStage && shouldCreateTask) {
        task = tasks.create({
          organizationId: actor.organizationId,
          orderId: order.id,
          order,
          operatorName: order.operatorName,
          stage: targetStage,
        });
        task = await tasks.save(task);
        taskCreated = true;
      } else if (task && targetStage && task.stage !== targetStage) {
        previousTaskStage = task.stage;
        task.stage = targetStage;
        await tasks.save(task);
      }
      return { order, previousStatus, changed, task, taskCreated, previousTaskStage };
    });

    if (result.changed) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.ORDER_STATUS_UPDATED,
        entityType: 'ORDER',
        entityId: result.order.id,
        metadata: { from: result.previousStatus, to: result.order.status },
      });
    }
    if (result.taskCreated && result.task) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCTION_TASK_CREATED,
        entityType: 'PRODUCTION_TASK',
        entityId: result.task.id,
        metadata: { orderId: result.order.id, source: 'order-status' },
      });
    } else if (result.task && result.previousTaskStage) {
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCTION_STAGE_UPDATED,
        entityType: 'PRODUCTION_TASK',
        entityId: result.task.id,
        metadata: {
          from: result.previousTaskStage,
          to: result.task.stage,
          source: 'order-status',
        },
      });
    }
    return this.toSummary(result.order);
  }

  private toProductionStage(status: OrderStatus): ProductionTaskStage | null {
    switch (status) {
      case OrderStatus.TO_PRODUCE:
        return ProductionTaskStage.TO_PRODUCE;
      case OrderStatus.IN_PRODUCTION:
        return ProductionTaskStage.IN_PRODUCTION;
      case OrderStatus.QUALITY_CONTROL:
        return ProductionTaskStage.QUALITY_CONTROL;
      case OrderStatus.READY:
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return ProductionTaskStage.COMPLETED;
      default:
        return null;
    }
  }

  private toSummary(order: SalesOrder): OrderSummaryDto {
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
}
