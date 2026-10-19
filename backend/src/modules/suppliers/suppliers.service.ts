import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierSummaryDto } from './dto/supplier-summary.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<SupplierSummaryDto[]> {
    const suppliers = await this.suppliersRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
    return suppliers.map((supplier) => this.toSummary(supplier));
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateSupplierDto,
  ): Promise<SupplierSummaryDto> {
    const supplier = await this.suppliersRepository.save(
      this.suppliersRepository.create({
        ...dto,
        organizationId: actor.organizationId,
      }),
    );
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.SUPPLIER_CREATED,
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      metadata: { category: supplier.category },
    });
    return this.toSummary(supplier);
  }

  async update(
    actor: AuthenticatedUser,
    supplierId: string,
    dto: UpdateSupplierDto,
  ): Promise<SupplierSummaryDto> {
    const supplier = await this.findForOrganization(actor.organizationId, supplierId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Indiquez au moins une modification.');
    }
    Object.assign(supplier, updates);
    const updated = await this.suppliersRepository.save(supplier);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.SUPPLIER_UPDATED,
      entityType: 'SUPPLIER',
      entityId: updated.id,
      metadata: { fields: Object.keys(updates) },
    });
    return this.toSummary(updated);
  }

  async archive(actor: AuthenticatedUser, supplierId: string): Promise<void> {
    const supplier = await this.findForOrganization(actor.organizationId, supplierId);
    await this.suppliersRepository.softRemove(supplier);
    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.SUPPLIER_DELETED,
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      metadata: { category: supplier.category },
    });
  }

  private async findForOrganization(
    organizationId: string,
    supplierId: string,
  ): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id: supplierId, organizationId },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    return supplier;
  }

  private toSummary(supplier: Supplier): SupplierSummaryDto {
    return {
      id: supplier.id,
      name: supplier.name,
      category: supplier.category,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      city: supplier.city,
      notes: supplier.notes,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
