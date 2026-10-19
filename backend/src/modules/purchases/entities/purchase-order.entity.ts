import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseOrderStatus } from './purchase-order-status.enum';
import { PurchaseOrderLine } from './purchase-order-line.entity';

const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'purchase_orders' })
@Index(['organizationId', 'purchaseNumber'], { unique: true })
@Index(['organizationId', 'status', 'createdAt'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'purchase_number', length: 32 })
  purchaseNumber: string;

  @Column({ name: 'supplier_id', type: 'char', length: 36 })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_name', length: 160 })
  supplierName: string;

  @Column({ type: 'varchar', length: 24, default: PurchaseOrderStatus.ORDERED })
  status: PurchaseOrderStatus;

  @Column({ name: 'expected_date', type: 'date', nullable: true })
  expectedDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: decimalNumberTransformer })
  total: number;

  @OneToMany(() => PurchaseOrderLine, (line) => line.purchaseOrder)
  lines: PurchaseOrderLine[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
