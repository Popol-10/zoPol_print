import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { InvoiceEligibleOrderDto } from './dto/invoice-eligible-order.dto';
import { InvoiceLineSummaryDto, InvoiceSummaryDto } from './dto/invoice-summary.dto';
import { InvoiceLine } from './entities/invoice-line.entity';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(SalesOrder)
    private readonly ordersRepository: Repository<SalesOrder>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<InvoiceSummaryDto[]> {
    const invoices = await this.invoicesRepository.find({
      where: { organizationId },
      relations: { order: true, lines: true },
      order: { issuedAt: 'DESC', createdAt: 'DESC' },
    });
    return invoices.map((invoice) => this.toSummary(invoice));
  }

  async findEligibleOrders(organizationId: string): Promise<InvoiceEligibleOrderDto[]> {
    const [invoices, orders] = await Promise.all([
      this.invoicesRepository.find({ where: { organizationId }, select: { orderId: true } }),
      this.ordersRepository.find({ where: { organizationId }, order: { orderedAt: 'DESC' } }),
    ]);
    const invoicedOrderIds = new Set(invoices.map((invoice) => invoice.orderId));
    return orders
      .filter((order) => order.status !== OrderStatus.CANCELLED && !invoicedOrderIds.has(order.id))
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        clientCompany: order.clientCompany,
        productName: order.productName,
        productReference: order.productReference,
        quantity: order.quantity,
        unitPrice: Number(order.unitPrice),
        total: Number(order.total),
        paidAmount: Number(order.paidAmount),
        status: order.status,
        orderedAt: order.orderedAt,
      }));
  }

  async issueFromOrder(actor: AuthenticatedUser, orderId: string): Promise<InvoiceSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(SalesOrder);
      const invoices = manager.getRepository(Invoice);
      const lines = manager.getRepository(InvoiceLine);
      const order = await orders.findOne({
        where: { id: orderId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Commande introuvable.');
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Une commande annulée ne peut pas être facturée.');
      }
      const existing = await invoices.findOne({
        where: { organizationId: actor.organizationId, orderId: order.id },
        relations: { order: true, lines: true },
      });
      if (existing) return this.toSummary(existing);

      const organization = await manager.getRepository(Organization).findOne({
        where: { id: actor.organizationId },
        select: { id: true, timezone: true },
      });
      const issuedAt = this.currentDateInTimeZone(organization?.timezone ?? 'Indian/Antananarivo');
      const invoice = invoices.create({
        organizationId: actor.organizationId,
        orderId: order.id,
        order,
        invoiceNumber: `FAC-${issuedAt.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`,
        clientName: order.clientName,
        clientCompany: order.clientCompany,
        issuedAt,
        total: Number(order.total),
      });
      const savedInvoice = await invoices.save(invoice);
      const savedLine = await lines.save(
        lines.create({
          invoiceId: savedInvoice.id,
          invoice: savedInvoice,
          productName: order.productName,
          productReference: order.productReference,
          machine: order.machine,
          quantity: order.quantity,
          unitPrice: Number(order.unitPrice),
          lineTotal: Number(order.total),
        }),
      );
      savedInvoice.order = order;
      savedInvoice.lines = [savedLine];

      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.INVOICE_ISSUED,
        entityType: 'INVOICE',
        entityId: savedInvoice.id,
        metadata: {
          invoiceNumber: savedInvoice.invoiceNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: savedInvoice.total,
        },
        manager,
      });
      return this.toSummary(savedInvoice);
    });
  }

  private toSummary(invoice: Invoice): InvoiceSummaryDto {
    const paidAmount = Math.max(0, Math.min(Number(invoice.order?.paidAmount ?? 0), Number(invoice.total)));
    const balanceDue = Math.max(0, Number(invoice.total) - paidAmount);
    const paymentStatus =
      paidAmount >= Number(invoice.total) ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'ISSUED';
    const invoiceLines: InvoiceLineSummaryDto[] = (invoice.lines ?? []).map((line) => ({
      id: line.id,
      productName: line.productName,
      productReference: line.productReference,
      machine: line.machine,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      lineTotal: Number(line.lineTotal),
    }));
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      orderNumber: invoice.order?.orderNumber ?? '',
      clientName: invoice.clientName,
      clientCompany: invoice.clientCompany,
      issuedAt: invoice.issuedAt,
      total: Number(invoice.total),
      paidAmount,
      balanceDue,
      paymentStatus,
      lines: invoiceLines,
      createdAt: invoice.createdAt,
    };
  }

  private currentDateInTimeZone(timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
}
