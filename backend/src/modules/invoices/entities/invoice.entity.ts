import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { InvoiceLine } from './invoice-line.entity';

const amountTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'invoices' })
@Index('UQ_invoices_organization_number', ['organizationId', 'invoiceNumber'], { unique: true })
@Index('UQ_invoices_order', ['orderId'], { unique: true })
@Index('IDX_invoices_organization_issued_at', ['organizationId', 'issuedAt'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'order_id', type: 'char', length: 36 })
  orderId: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column({ name: 'invoice_number', length: 32 })
  invoiceNumber: string;

  @Column({ name: 'client_name', length: 160 })
  clientName: string;

  @Column({ name: 'client_company', type: 'varchar', length: 160, nullable: true })
  clientCompany: string | null;

  @Column({ name: 'issued_at', type: 'date' })
  issuedAt: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: amountTransformer })
  total: number;

  @OneToMany(() => InvoiceLine, (line) => line.invoice)
  lines: InvoiceLine[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
