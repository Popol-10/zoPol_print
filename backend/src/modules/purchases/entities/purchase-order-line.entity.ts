import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StockItem } from '../../stock/entities/stock-item.entity';
import { PurchaseOrder } from './purchase-order.entity';

const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'purchase_order_lines' })
export class PurchaseOrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id', type: 'char', length: 36 })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (order) => order.lines, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'stock_item_id', type: 'char', length: 36 })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stock_item_id' })
  stockItem: StockItem;

  @Column({ name: 'item_name', length: 160 })
  itemName: string;

  @Column({ name: 'item_reference', length: 64 })
  itemReference: string;

  @Column({ length: 32 })
  unit: string;

  @Column({ name: 'quantity_ordered', type: 'int', unsigned: true })
  quantityOrdered: number;

  @Column({ name: 'quantity_received', type: 'int', unsigned: true, default: 0 })
  quantityReceived: number;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  unitCost: number;
}
