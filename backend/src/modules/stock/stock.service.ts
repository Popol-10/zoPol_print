import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CountStockItemDto } from './dto/count-stock-item.dto';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockItemSummaryDto } from './dto/stock-item-summary.dto';
import { StockMovementSummaryDto } from './dto/stock-movement-summary.dto';
import { StockMovementPageDto } from './dto/stock-movement-page.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { StockItem } from './entities/stock-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDirection, StockMovementKind } from './entities/stock-movement-kind.enum';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private readonly itemsRepository: Repository<StockItem>,
    @InjectRepository(StockMovement)
    private readonly movementsRepository: Repository<StockMovement>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAllItems(organizationId: string): Promise<StockItemSummaryDto[]> {
    const items = await this.itemsRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
    return items.map((item) => this.toItemSummary(item));
  }

  async createItem(actor: AuthenticatedUser, dto: CreateStockItemDto): Promise<StockItemSummaryDto> {
    await this.assertReferenceAvailable(actor.organizationId, dto.reference);
    let item: StockItem;
    try {
      const newItem: StockItem = Object.assign(new StockItem(), dto, {
        quantity: 0,
        organizationId: actor.organizationId,
      });
      item = await this.itemsRepository.save(newItem);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Cette référence de stock existe déjà.');
      }
      throw error;
    }
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.STOCK_ITEM_CREATED,
      entityType: 'STOCK_ITEM',
      entityId: item.id,
      metadata: { reference: item.reference },
    });
    return this.toItemSummary(item);
  }

  async updateItem(
    actor: AuthenticatedUser,
    itemId: string,
    dto: UpdateStockItemDto,
  ): Promise<StockItemSummaryDto> {
    const item = await this.findItem(actor.organizationId, itemId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined && value !== null),
    ) as UpdateStockItemDto;
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Indiquez au moins une modification.');
    }
    if (updates.reference) {
      await this.assertReferenceAvailable(actor.organizationId, updates.reference, item.id);
    }
    Object.assign(item, updates);
    let updated: StockItem;
    try {
      updated = await this.itemsRepository.save(item);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Cette référence de stock existe déjà.');
      }
      throw error;
    }
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.STOCK_ITEM_UPDATED,
      entityType: 'STOCK_ITEM',
      entityId: updated.id,
      metadata: { fields: Object.keys(updates) },
    });
    return this.toItemSummary(updated);
  }

  async archiveItem(actor: AuthenticatedUser, itemId: string): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    let item: StockItem | null = null;
    try {
      await runner.startTransaction();
      const foundItem = await runner.manager.findOne(StockItem, {
        where: { id: itemId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!foundItem) throw new NotFoundException('Article de stock introuvable.');
      item = foundItem;
      if (item.quantity > 0) {
        throw new BadRequestException('Un article ne peut être archivé que lorsque son stock est à zéro.');
      }
      await runner.manager.softRemove(item);
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    if (!item) throw new NotFoundException('Article de stock introuvable.');
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.STOCK_ITEM_DELETED,
      entityType: 'STOCK_ITEM',
      entityId: item.id,
      metadata: { reference: item.reference },
    });
  }

  async findMovements(organizationId: string, itemId: string): Promise<StockMovementSummaryDto[]> {
    await this.findItem(organizationId, itemId);
    const movements = await this.movementsRepository.find({
      where: { organizationId, itemId },
      relations: { item: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return movements.map((movement) => this.toMovementSummary(movement));
  }

  async findAllMovements(
    organizationId: string,
    query: StockMovementQueryDto,
  ): Promise<StockMovementPageDto> {
    const builder = this.movementsRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.item', 'item')
      .withDeleted()
      .where('movement.organizationId = :organizationId', { organizationId });

    if (query.kind) {
      builder.andWhere('movement.kind = :kind', { kind: query.kind });
    }
    if (query.itemId) {
      builder.andWhere('movement.itemId = :itemId', { itemId: query.itemId });
    }
    if (query.search) {
      builder.andWhere(
        '(item.name LIKE :search OR item.reference LIKE :search OR movement.source LIKE :search OR movement.notes LIKE :search OR movement.actorName LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [movements, total] = await builder
      .orderBy('movement.createdAt', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();

    return {
      items: movements.map((movement) => this.toMovementSummary(movement)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async createMovement(
    actor: AuthenticatedUser,
    dto: CreateStockMovementDto,
  ): Promise<StockMovementSummaryDto> {
    let delta = dto.quantity;
    if (dto.kind === StockMovementKind.EXIT) delta = -dto.quantity;
    if (dto.kind === StockMovementKind.ADJUSTMENT) {
      if (!dto.direction) {
        throw new BadRequestException('Précisez le sens de l’ajustement du stock.');
      }
      if (dto.direction === StockAdjustmentDirection.DECREASE) {
        delta = -dto.quantity;
      }
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    let savedMovement: StockMovement;
    try {
      await runner.startTransaction();
      const item = await runner.manager.findOne(StockItem, {
        where: { id: dto.itemId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Article de stock introuvable.');
      const beforeQuantity = item.quantity;
      const afterQuantity = beforeQuantity + delta;
      if (afterQuantity < 0) {
        throw new BadRequestException('Cette sortie dépasse la quantité disponible en stock.');
      }
      if (afterQuantity > 4_294_967_295) {
        throw new BadRequestException('La quantité maximale de stock est dépassée.');
      }
      item.quantity = afterQuantity;
      await runner.manager.save(item);
      savedMovement = await runner.manager.save(
        runner.manager.create(StockMovement, {
          organizationId: actor.organizationId,
          itemId: item.id,
          item,
          kind: dto.kind,
          delta,
          beforeQuantity,
          afterQuantity,
          actorId: actor.id,
          actorName: `${actor.firstName} ${actor.lastName}`.trim().slice(0, 160),
          source: dto.source ?? null,
          notes: dto.notes ?? null,
        }),
      );
      await runner.commitTransaction();
      savedMovement.item = item;
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.STOCK_MOVEMENT_CREATED,
      entityType: 'STOCK_MOVEMENT',
      entityId: savedMovement.id,
      metadata: {
        itemId: savedMovement.itemId,
        kind: savedMovement.kind,
        delta: savedMovement.delta,
        afterQuantity: savedMovement.afterQuantity,
      },
    });
    return this.toMovementSummary(savedMovement);
  }

  async countItem(
    actor: AuthenticatedUser,
    itemId: string,
    dto: CountStockItemDto,
  ): Promise<StockMovementSummaryDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    let savedMovement: StockMovement;
    try {
      await runner.startTransaction();
      const item = await runner.manager.findOne(StockItem, {
        where: { id: itemId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Article de stock introuvable.');

      const beforeQuantity = item.quantity;
      const delta = dto.quantity - beforeQuantity;
      if (delta > 2_147_483_647 || delta < -2_147_483_648) {
        throw new BadRequestException('L’écart de comptage dépasse la capacité autorisée.');
      }
      item.quantity = dto.quantity;
      await runner.manager.save(item);
      savedMovement = await runner.manager.save(
        runner.manager.create(StockMovement, {
          organizationId: actor.organizationId,
          itemId: item.id,
          item,
          kind: StockMovementKind.ADJUSTMENT,
          delta,
          beforeQuantity,
          afterQuantity: dto.quantity,
          actorId: actor.id,
          actorName: `${actor.firstName} ${actor.lastName}`.trim().slice(0, 160),
          source: 'Inventaire',
          notes: dto.notes ?? `Comptage physique : ${dto.quantity}`,
        }),
      );
      await runner.commitTransaction();
      savedMovement.item = item;
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.STOCK_MOVEMENT_CREATED,
      entityType: 'STOCK_MOVEMENT',
      entityId: savedMovement.id,
      metadata: {
        itemId: savedMovement.itemId,
        kind: savedMovement.kind,
        delta: savedMovement.delta,
        afterQuantity: savedMovement.afterQuantity,
        source: 'inventory-count',
      },
    });
    return this.toMovementSummary(savedMovement);
  }

  private async findItem(organizationId: string, itemId: string): Promise<StockItem> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId, organizationId },
    });
    if (!item) throw new NotFoundException('Article de stock introuvable.');
    return item;
  }

  private async assertReferenceAvailable(
    organizationId: string,
    reference: string,
    excludingId?: string,
  ): Promise<void> {
    const existing = await this.itemsRepository.findOne({
      where: { organizationId, reference: reference.trim().toUpperCase() },
      withDeleted: true,
    });
    if (existing && existing.id !== excludingId) {
      throw new ConflictException('Cette référence de stock existe déjà.');
    }
  }

  private toItemSummary(item: StockItem): StockItemSummaryDto {
    const unitCost = Number(item.unitCost);
    return {
      id: item.id,
      name: item.name,
      reference: item.reference,
      category: item.category,
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      unit: item.unit,
      unitCost,
      value: Math.round(item.quantity * unitCost),
      status: this.getStatus(item.quantity, item.minimumQuantity),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toMovementSummary(movement: StockMovement): StockMovementSummaryDto {
    return {
      id: movement.id,
      itemId: movement.itemId,
      itemName: movement.item.name,
      itemReference: movement.item.reference,
      kind: movement.kind,
      delta: movement.delta,
      beforeQuantity: movement.beforeQuantity,
      afterQuantity: movement.afterQuantity,
      actorName: movement.actorName,
      source: movement.source,
      notes: movement.notes,
      createdAt: movement.createdAt,
    };
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }

  private getStatus(quantity: number, minimum: number): string {
    if (quantity <= 0) return 'Rupture';
    if (quantity < minimum * 0.6) return 'Critique';
    if (quantity < minimum) return 'Stock faible';
    return 'En stock';
  }
}
