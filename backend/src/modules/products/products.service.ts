import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { ProductSummaryDto } from './dto/product-summary.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Machine } from '../machines/entities/machine.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Machine)
    private readonly machinesRepository: Repository<Machine>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<ProductSummaryDto[]> {
    const products = await this.productsRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
    return products.map((product) => this.toSummary(product));
  }

  async create(actor: AuthenticatedUser, dto: CreateProductDto): Promise<ProductSummaryDto> {
    await this.assertMachineExists(actor.organizationId, dto.machine);
    try {
      const product = await this.productsRepository.save(
        this.productsRepository.create({
          ...dto,
          organizationId: actor.organizationId,
        }),
      );
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCT_CREATED,
        entityType: 'PRODUCT',
        entityId: product.id,
        metadata: { reference: product.reference, category: product.category },
      });
      return this.toSummary(product);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Cette référence produit existe déjà.');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductSummaryDto> {
    const product = await this.findForOrganization(actor.organizationId, productId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined && value !== null),
    );
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Indiquez au moins une modification.');
    }
    if (typeof dto.machine === 'string') {
      await this.assertMachineExists(actor.organizationId, dto.machine);
    }
    Object.assign(product, updates);

    try {
      const updated = await this.productsRepository.save(product);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.PRODUCT_UPDATED,
        entityType: 'PRODUCT',
        entityId: updated.id,
        metadata: { fields: Object.keys(updates) },
      });
      return this.toSummary(updated);
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Cette référence produit existe déjà.');
      }
      throw error;
    }
  }

  async archive(actor: AuthenticatedUser, productId: string): Promise<void> {
    const product = await this.findForOrganization(actor.organizationId, productId);
    await this.productsRepository.softRemove(product);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.PRODUCT_DELETED,
      entityType: 'PRODUCT',
      entityId: product.id,
      metadata: { reference: product.reference },
    });
  }

  private async assertMachineExists(organizationId: string, name: string): Promise<void> {
    const machine = await this.machinesRepository.findOne({
      where: { organizationId, name: name.trim() },
    });
    if (!machine) {
      throw new BadRequestException('Sélectionnez une machine enregistrée dans le module Machines.');
    }
  }

  private async findForOrganization(organizationId: string, productId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id: productId, organizationId },
    });
    if (!product) throw new NotFoundException('Produit introuvable.');
    return product;
  }

  private toSummary(product: Product): ProductSummaryDto {
    return {
      id: product.id,
      name: product.name,
      reference: product.reference,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      unit: product.unit,
      machine: product.machine,
      duration: product.duration,
      color: product.color,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
