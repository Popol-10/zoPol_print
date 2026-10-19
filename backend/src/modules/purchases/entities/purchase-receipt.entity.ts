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
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseReceiptLine } from './purchase-receipt-line.entity';

@Entity({ name: 'purchase_receipts' })
@Index(['organizationId', 'receiptNumber'], { unique: true })
@Index(['organizationId', 'receivedAt'])
export class PurchaseReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'purchase_order_id', type: 'char', length: 36 })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'receipt_number', length: 36 })
  receiptNumber: string;

  @Column({ name: 'delivery_reference', type: 'varchar', length: 120, nullable: true })
  deliveryReference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'actor_id', type: 'char', length: 36 })
  actorId: string;

  @Column({ name: 'actor_name', length: 160 })
  actorName: string;

  @OneToMany(() => PurchaseReceiptLine, (line) => line.receipt)
  lines: PurchaseReceiptLine[];

  @CreateDateColumn({ name: 'received_at', type: 'datetime', precision: 6 })
  receivedAt: Date;
}
