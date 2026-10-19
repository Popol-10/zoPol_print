import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { StockItem } from '../stock/entities/stock-item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderSummaryDto } from './dto/purchase-order-summary.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { PurchaseOrderStatus } from './entities/purchase-order-status.enum';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { PurchaseReceiptSummaryDto } from './dto/purchase-receipt-summary.dto';
import { PurchaseReceipt } from './entities/purchase-receipt.entity';
import { PurchaseReceiptLine } from './entities/purchase-receipt-line.entity';
import { StockMovementKind } from '../stock/entities/stock-movement-kind.enum';
import { StockMovement } from '../stock/entities/stock-movement.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepository: Repository<PurchaseOrder>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<PurchaseOrderSummaryDto[]> {
    const orders = await this.ordersRepository.find({
      where: { organizationId },
      relations: { lines: true },
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) => this.toSummary(order));
  }

  async findAllReceipts(organizationId: string): Promise<PurchaseReceiptSummaryDto[]> {
    const receipts = await this.dataSource.getRepository(PurchaseReceipt).find({
      where: { organizationId },
      relations: { purchaseOrder: true, lines: true },
      order: { receivedAt: 'DESC' },
      take: 200,
    });
    return receipts.map((receipt) => this.toReceiptSummary(receipt));
  }

  async receive(
    actor: AuthenticatedUser,
    purchaseOrderId: string,
    dto: CreatePurchaseReceiptDto,
    context?: RequestContext,
  ): Promise<PurchaseReceiptSummaryDto> {
    const requestedLineIds = dto.lines.map((line) => line.purchaseOrderLineId);
    if (new Set(requestedLineIds).size !== requestedLineIds.length) {
      throw new BadRequestException('Une ligne de commande ne peut apparaître qu’une fois par réception.');
    }

    return this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(PurchaseOrder);
      const orderLinesRepository = manager.getRepository(PurchaseOrderLine);
      const order = await orders.findOne({
        where: { id: purchaseOrderId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Commande fournisseur introuvable.');
      if (order.status === PurchaseOrderStatus.RECEIVED) {
        throw new ConflictException('Cette commande fournisseur est déjà entièrement reçue.');
      }

      const orderLines = await orderLinesRepository.find({
        where: { purchaseOrderId: order.id },
        order: { stockItemId: 'ASC' },
      });
      const orderLinesById = new Map(orderLines.map((line) => [line.id, line]));
      const requestedLines = dto.lines
        .map((requestedLine) => {
          const orderLine = orderLinesById.get(requestedLine.purchaseOrderLineId);
          if (!orderLine) {
            throw new NotFoundException('Une ligne ne correspond pas à cette commande fournisseur.');
          }
          const remaining = orderLine.quantityOrdered - orderLine.quantityReceived;
          if (requestedLine.quantity > remaining) {
            throw new BadRequestException(
              `La quantité reçue pour ${orderLine.itemName} dépasse le restant à livrer (${remaining}).`,
            );
          }
          return { orderLine, quantity: requestedLine.quantity };
        })
        .sort((left, right) => left.orderLine.stockItemId.localeCompare(right.orderLine.stockItemId));

      const receiptRepository = manager.getRepository(PurchaseReceipt);
      const receiptLinesRepository = manager.getRepository(PurchaseReceiptLine);
      const receipt = receiptRepository.create({
        organizationId: actor.organizationId,
        purchaseOrderId: order.id,
        purchaseOrder: order,
        receiptNumber: `REC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        deliveryReference: dto.deliveryReference ?? null,
        notes: dto.notes ?? null,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim().slice(0, 160),
      });
      const savedReceipt = await receiptRepository.save(receipt);
      const savedReceiptLines: PurchaseReceiptLine[] = [];

      for (const requestedLine of requestedLines) {
        const { orderLine, quantity } = requestedLine;
        const item = await manager.findOne(StockItem, {
          where: { id: orderLine.stockItemId, organizationId: actor.organizationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!item) {
          throw new NotFoundException(`L’article ${orderLine.itemName} n’est plus actif dans le stock.`);
        }

        const beforeQuantity = item.quantity;
        const afterQuantity = beforeQuantity + quantity;
        if (afterQuantity > 4_294_967_295) {
          throw new BadRequestException(`La quantité maximale de stock est dépassée pour ${item.name}.`);
        }
        item.quantity = afterQuantity;
        await manager.save(item);

        const movement = await manager.save(
          manager.create(StockMovement, {
            organizationId: actor.organizationId,
            itemId: item.id,
            item,
            kind: StockMovementKind.ENTRY,
            delta: quantity,
            beforeQuantity,
            afterQuantity,
            actorId: actor.id,
            actorName: savedReceipt.actorName,
            source: `${order.supplierName} · ${order.purchaseNumber}`.slice(0, 160),
            notes:
              [
                `Réception ${savedReceipt.receiptNumber}`,
                dto.deliveryReference ? `BL ${dto.deliveryReference}` : null,
                dto.notes,
              ]
                .filter(Boolean)
                .join(' · ') || null,
          }),
        );

        orderLine.quantityReceived += quantity;
        savedReceiptLines.push(
          receiptLinesRepository.create({
            receiptId: savedReceipt.id,
            receipt: savedReceipt,
            purchaseOrderLineId: orderLine.id,
            purchaseOrderLine: orderLine,
            stockItemId: item.id,
            stockItem: item,
            stockMovementId: movement.id,
            stockMovement: movement,
            itemName: orderLine.itemName,
            itemReference: orderLine.itemReference,
            unit: orderLine.unit,
            quantity,
          }),
        );
      }

      await receiptLinesRepository.save(savedReceiptLines);
      await orderLinesRepository.save(orderLines);
      order.status = orderLines.every((line) => line.quantityReceived >= line.quantityOrdered)
        ? PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIALLY_RECEIVED;
      await orders.save(order);

      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PURCHASE_RECEIPT_CREATED,
        entityType: 'PURCHASE_RECEIPT',
        entityId: savedReceipt.id,
        metadata: {
          receiptNumber: savedReceipt.receiptNumber,
          purchaseOrderId: order.id,
          purchaseNumber: order.purchaseNumber,
          lineCount: savedReceiptLines.length,
          totalQuantity: savedReceiptLines.reduce((sum, line) => sum + line.quantity, 0),
        },
        context,
        manager,
      });

      savedReceipt.lines = savedReceiptLines;
      return this.toReceiptSummary(savedReceipt);
    });
  }

  async create(actor: AuthenticatedUser, dto: CreatePurchaseOrderDto): Promise<PurchaseOrderSummaryDto> {
    const itemIds = dto.lines.map((line) => line.stockItemId);
    if (new Set(itemIds).size !== itemIds.length) {
      throw new BadRequestException('Un article ne peut apparaître qu’une fois par commande fournisseur.');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const suppliers = manager.getRepository(Supplier);
      const stockItems = manager.getRepository(StockItem);
      const orders = manager.getRepository(PurchaseOrder);
      const orderLines = manager.getRepository(PurchaseOrderLine);

      const [supplier, items] = await Promise.all([
        suppliers.findOne({
          where: { id: dto.supplierId, organizationId: actor.organizationId },
        }),
        stockItems.find({
          where: { id: In(itemIds), organizationId: actor.organizationId },
        }),
      ]);
      if (!supplier) throw new NotFoundException('Fournisseur introuvable ou archivé.');
      if (items.length !== itemIds.length) {
        throw new NotFoundException('Un article de stock est introuvable ou archivé.');
      }

      const itemsById = new Map(items.map((item) => [item.id, item]));
      const total = Number(
        dto.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0).toFixed(2),
      );
      if (!Number.isFinite(total) || total > 999_999_999_999.99) {
        throw new BadRequestException('Le total de la commande fournisseur dépasse la limite autorisée.');
      }

      const now = new Date();
      const order = orders.create({
        organizationId: actor.organizationId,
        purchaseNumber: `ACH-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        supplierId: supplier.id,
        supplier,
        supplierName: supplier.name,
        status: PurchaseOrderStatus.ORDERED,
        expectedDate: dto.expectedDate ?? null,
        notes: dto.notes ?? null,
        total,
      });
      const savedOrder = await orders.save(order);
      const lines = dto.lines.map((line) => {
        const item = itemsById.get(line.stockItemId);
        if (!item) throw new NotFoundException('Article de stock introuvable.');
        return orderLines.create({
          purchaseOrderId: savedOrder.id,
          purchaseOrder: savedOrder,
          stockItemId: item.id,
          stockItem: item,
          itemName: item.name,
          itemReference: item.reference,
          unit: item.unit,
          quantityOrdered: line.quantity,
          quantityReceived: 0,
          unitCost: line.unitCost,
        });
      });
      const savedLines = await orderLines.save(lines);
      savedOrder.lines = savedLines;
      return savedOrder;
    });

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.PURCHASE_ORDER_CREATED,
      entityType: 'PURCHASE_ORDER',
      entityId: saved.id,
      metadata: {
        purchaseNumber: saved.purchaseNumber,
        supplierId: saved.supplierId,
        total: saved.total,
        lineCount: saved.lines.length,
      },
    });
    return this.toSummary(saved);
  }

  private toSummary(order: PurchaseOrder): PurchaseOrderSummaryDto {
    const lines = order.lines ?? [];
    return {
      id: order.id,
      purchaseNumber: order.purchaseNumber,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      status: order.status,
      expectedDate: order.expectedDate,
      notes: order.notes,
      total: Number(order.total),
      lineCount: lines.length,
      lines: lines.map((line) => {
        const quantityReceived = line.quantityReceived ?? 0;
        return {
          id: line.id,
          stockItemId: line.stockItemId,
          itemName: line.itemName,
          itemReference: line.itemReference,
          unit: line.unit,
          quantityOrdered: line.quantityOrdered,
          quantityReceived,
          quantityRemaining: Math.max(0, line.quantityOrdered - quantityReceived),
          unitCost: Number(line.unitCost),
          total: Number((line.quantityOrdered * Number(line.unitCost)).toFixed(2)),
        };
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private toReceiptSummary(receipt: PurchaseReceipt): PurchaseReceiptSummaryDto {
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      purchaseOrderId: receipt.purchaseOrderId,
      purchaseNumber: receipt.purchaseOrder.purchaseNumber,
      supplierName: receipt.purchaseOrder.supplierName,
      deliveryReference: receipt.deliveryReference,
      notes: receipt.notes,
      actorName: receipt.actorName,
      receivedAt: receipt.receivedAt,
      lines: (receipt.lines ?? []).map((line) => ({
        id: line.id,
        purchaseOrderLineId: line.purchaseOrderLineId,
        stockItemId: line.stockItemId,
        itemName: line.itemName,
        itemReference: line.itemReference,
        unit: line.unit,
        quantity: line.quantity,
      })),
    };
  }
}
