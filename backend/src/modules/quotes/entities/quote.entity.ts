import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Product } from '../../products/entities/product.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { QuoteStatus } from './quote-status.enum';

const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'quotes' })
@Index(['organizationId', 'quoteNumber'], { unique: true })
@Index(['organizationId', 'status', 'createdAt'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'quote_number', length: 32 })
  quoteNumber: string;

  @Column({ name: 'client_id', type: 'char', length: 36 })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_name', length: 160 })
  clientName: string;

  @Column({ name: 'client_company', type: 'varchar', length: 160, nullable: true })
  clientCompany: string | null;

  @Column({ name: 'product_id', type: 'char', length: 36 })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_name', length: 160 })
  productName: string;

  @Column({ name: 'product_reference', length: 64 })
  productReference: string;

  @Column({ length: 120 })
  machine: string;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: decimalNumberTransformer })
  total: number;

  @Column({ type: 'varchar', length: 16, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Column({ name: 'valid_until', type: 'date' })
  validUntil: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'order_id', type: 'char', length: 36, nullable: true })
  orderId: string | null;

  @OneToOne(() => SalesOrder, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.note = this.note?.trim() || null;
  }
}
