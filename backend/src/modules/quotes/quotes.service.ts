import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Client } from '../clients/entities/client.entity';
import { MailService } from '../mail/mail.service';
import { Organization } from '../organizations/entities/organization.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { OrderPriority } from '../orders/entities/order-priority.enum';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteSummaryDto } from './dto/quote-summary.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { Quote } from './entities/quote.entity';
import { QuoteStatus } from './entities/quote-status.enum';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async findAll(organizationId: string): Promise<QuoteSummaryDto[]> {
    const quotes = await this.quotesRepository.find({
      where: { organizationId },
      relations: { order: true },
      order: { createdAt: 'DESC' },
    });
    return quotes.map((quote) => this.toSummary(quote));
  }

  async create(actor: AuthenticatedUser, dto: CreateQuoteDto): Promise<QuoteSummaryDto> {
    this.assertValidUntil(dto.validUntil);
    const [client, product] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: dto.clientId, organizationId: actor.organizationId },
      }),
      this.productsRepository.findOne({
        where: { id: dto.productId, organizationId: actor.organizationId },
      }),
    ]);
    if (!client) throw new NotFoundException('Client introuvable ou archivé.');
    if (!product) throw new NotFoundException('Produit introuvable ou archivé.');

    const total = Number((dto.unitPrice * dto.quantity).toFixed(2));
    if (!Number.isFinite(total) || total > 999999999999.99) {
      throw new BadRequestException('Le montant total du devis dépasse la limite autorisée.');
    }

    return this.dataSource.transaction(async (manager) => {
      const quotes = manager.getRepository(Quote);
      const now = new Date();
      const quote = quotes.create({
        organizationId: actor.organizationId,
        quoteNumber: `DEV-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
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
        unitPrice: Number(dto.unitPrice.toFixed(2)),
        total,
        status: QuoteStatus.DRAFT,
        validUntil: dto.validUntil,
        note: dto.note ?? null,
        orderId: null,
        order: null,
      });
      const saved = await quotes.save(quote);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.QUOTE_CREATED,
        entityType: 'QUOTE',
        entityId: saved.id,
        metadata: {
          quoteNumber: saved.quoteNumber,
          clientId: saved.clientId,
          productId: saved.productId,
          total: saved.total,
        },
        manager,
      });
      return this.toSummary(saved);
    });
  }

  async updateStatus(
    actor: AuthenticatedUser,
    quoteId: string,
    dto: UpdateQuoteStatusDto,
  ): Promise<QuoteSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const quotes = manager.getRepository(Quote);
      const quote = await quotes.findOne({
        where: { id: quoteId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!quote) throw new NotFoundException('Devis introuvable.');
      if (quote.status === dto.status) return this.toSummary(quote);

      const allowed =
        quote.status === QuoteStatus.SENT &&
        (dto.status === QuoteStatus.REFUSED || dto.status === QuoteStatus.EXPIRED);
      if (!allowed) {
        throw new BadRequestException('Cette transition de statut du devis n’est pas autorisée.');
      }
      if (dto.status === QuoteStatus.EXPIRED && quote.validUntil >= this.today()) {
        throw new BadRequestException('La date de validité du devis n’est pas encore dépassée.');
      }

      const previousStatus = quote.status;
      quote.status = dto.status;
      const saved = await quotes.save(quote);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.QUOTE_STATUS_UPDATED,
        entityType: 'QUOTE',
        entityId: saved.id,
        metadata: { from: previousStatus, to: saved.status },
        manager,
      });
      return this.toSummary(saved);
    });
  }

  async sendByEmail(actor: AuthenticatedUser, quoteId: string): Promise<QuoteSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const quotes = manager.getRepository(Quote);
      const quote = await quotes.findOne({
        where: { id: quoteId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!quote) throw new NotFoundException('Devis introuvable.');
      if (quote.status === QuoteStatus.SENT) return this.toSummary(quote);
      if (quote.status !== QuoteStatus.DRAFT) {
        throw new BadRequestException('Seul un devis en brouillon peut être envoyé.');
      }
      this.assertValidUntil(quote.validUntil);
      const client = await manager.getRepository(Client).findOneBy({
        id: quote.clientId,
        organizationId: actor.organizationId,
      });
      const organization = await manager
        .getRepository(Organization)
        .findOneBy({ id: actor.organizationId });
      if (!client || !organization) {
        throw new NotFoundException('Le client ou l’organisation du devis est introuvable.');
      }
      if (!this.mailService.isEnabled()) {
        throw new ServiceUnavailableException(
          'L’envoi de courriels n’est pas configuré sur le serveur.',
        );
      }
      const recipient = client.email?.trim();
      if (!recipient) {
        throw new BadRequestException(
          'Ajoutez une adresse e-mail à la fiche du client avant d’envoyer ce devis.',
        );
      }

      await this.mailService.sendQuote({
        recipient,
        organizationName: organization.name,
        currency: organization.currency,
        quoteNumber: quote.quoteNumber,
        clientName: quote.clientName,
        clientCompany: quote.clientCompany,
        productName: quote.productName,
        productReference: quote.productReference,
        machine: quote.machine,
        quantity: quote.quantity,
        unitPrice: Number(quote.unitPrice),
        total: Number(quote.total),
        validUntil: quote.validUntil,
        note: quote.note,
      });

      quote.status = QuoteStatus.SENT;
      const saved = await quotes.save(quote);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.QUOTE_STATUS_UPDATED,
        entityType: 'QUOTE',
        entityId: saved.id,
        metadata: { from: QuoteStatus.DRAFT, to: QuoteStatus.SENT, delivery: 'EMAIL' },
        manager,
      });
      return this.toSummary(saved);
    });
  }

  async convertToOrder(actor: AuthenticatedUser, quoteId: string): Promise<QuoteSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const quotes = manager.getRepository(Quote);
      const orders = manager.getRepository(SalesOrder);
      const quote = await quotes.findOne({
        where: { id: quoteId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!quote) throw new NotFoundException('Devis introuvable.');
      if (quote.status === QuoteStatus.ACCEPTED && quote.orderId) {
        quote.order = await orders.findOneBy({ id: quote.orderId });
        return this.toSummary(quote);
      }
      if (quote.status !== QuoteStatus.SENT) {
        throw new BadRequestException('Seul un devis envoyé peut être converti.');
      }
      this.assertValidUntil(quote.validUntil);

      const now = new Date();
      const order = orders.create({
        organizationId: actor.organizationId,
        orderNumber: `CMD-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        clientId: quote.clientId,
        clientName: quote.clientName,
        clientCompany: quote.clientCompany,
        productId: quote.productId,
        productName: quote.productName,
        productReference: quote.productReference,
        machine: quote.machine,
        quantity: quote.quantity,
        unitPrice: quote.unitPrice,
        total: quote.total,
        paidAmount: 0,
        status: OrderStatus.NEW,
        priority: OrderPriority.NORMAL,
        orderedAt: now,
        dueDate: null,
        operatorName: 'À attribuer',
      });
      const savedOrder = await orders.save(order);
      quote.status = QuoteStatus.ACCEPTED;
      quote.orderId = savedOrder.id;
      quote.order = savedOrder;
      const savedQuote = await quotes.save(quote);

      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.ORDER_CREATED,
        entityType: 'ORDER',
        entityId: savedOrder.id,
        metadata: {
          orderNumber: savedOrder.orderNumber,
          clientId: savedOrder.clientId,
          productId: savedOrder.productId,
          total: savedOrder.total,
          sourceQuoteId: savedQuote.id,
        },
        manager,
      });
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.QUOTE_CONVERTED_TO_ORDER,
        entityType: 'QUOTE',
        entityId: savedQuote.id,
        metadata: { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber },
        manager,
      });
      return this.toSummary(savedQuote);
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private assertValidUntil(validUntil: string): void {
    if (validUntil < this.today()) {
      throw new BadRequestException('La date de validité du devis est dépassée.');
    }
  }

  private toSummary(quote: Quote): QuoteSummaryDto {
    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientCompany: quote.clientCompany,
      productId: quote.productId,
      productName: quote.productName,
      productReference: quote.productReference,
      machine: quote.machine,
      quantity: quote.quantity,
      unitPrice: Number(quote.unitPrice),
      total: Number(quote.total),
      status: quote.status,
      validUntil: quote.validUntil,
      note: quote.note,
      orderId: quote.orderId,
      orderNumber: quote.order?.orderNumber ?? null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}
