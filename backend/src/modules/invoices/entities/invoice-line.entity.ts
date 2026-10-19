import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

const amountTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'invoice_lines' })
export class InvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'char', length: 36 })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.lines, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'product_name', length: 160 })
  productName: string;

  @Column({ name: 'product_reference', length: 64 })
  productReference: string;

  @Column({ length: 120 })
  machine: string;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 2, transformer: amountTransformer })
  unitPrice: number;

  @Column({ name: 'line_total', type: 'decimal', precision: 14, scale: 2, transformer: amountTransformer })
  lineTotal: number;
}
