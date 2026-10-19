import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Client } from '../../clients/entities/client.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderPriority } from './order-priority.enum';
import { OrderStatus } from './order-status.enum';

const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'orders' })
@Index(['organizationId', 'orderNumber'], { unique: true })
@Index(['organizationId', 'orderedAt'])
@Index(['organizationId', 'status'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'order_number', length: 32 })
  orderNumber: string;

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

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  paidAmount: number;

  @Column({ type: 'varchar', length: 32, default: OrderStatus.NEW })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 16, default: OrderPriority.NORMAL })
  priority: OrderPriority;

  @Column({ name: 'ordered_at', type: 'datetime', precision: 6 })
  orderedAt: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'operator_name', type: 'varchar', length: 120, default: 'À attribuer' })
  operatorName: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
