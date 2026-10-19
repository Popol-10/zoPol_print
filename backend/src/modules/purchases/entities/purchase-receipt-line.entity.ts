import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StockItem } from '../../stock/entities/stock-item.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { PurchaseReceipt } from './purchase-receipt.entity';

@Entity({ name: 'purchase_receipt_lines' })
@Index(['receiptId', 'purchaseOrderLineId'], { unique: true })
export class PurchaseReceiptLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'receipt_id', type: 'char', length: 36 })
  receiptId: string;

  @ManyToOne(() => PurchaseReceipt, (receipt) => receipt.lines, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receipt_id' })
  receipt: PurchaseReceipt;

  @Column({ name: 'purchase_order_line_id', type: 'char', length: 36 })
  purchaseOrderLineId: string;

  @ManyToOne(() => PurchaseOrderLine, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_line_id' })
  purchaseOrderLine: PurchaseOrderLine;

  @Column({ name: 'stock_item_id', type: 'char', length: 36 })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stock_item_id' })
  stockItem: StockItem;

  @Column({ name: 'stock_movement_id', type: 'char', length: 36, unique: true })
  stockMovementId: string;

  @ManyToOne(() => StockMovement, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stock_movement_id' })
  stockMovement: StockMovement;

  @Column({ name: 'item_name', length: 160 })
  itemName: string;

  @Column({ name: 'item_reference', length: 64 })
  itemReference: string;

  @Column({ length: 32 })
  unit: string;

  @Column({ type: 'int', unsigned: true })
  quantity: number;
}
