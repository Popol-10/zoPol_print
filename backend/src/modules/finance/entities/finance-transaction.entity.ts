import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { BankReconciliation } from './bank-reconciliation.entity';
import { FinanceAccountMethod } from './finance-account-method.enum';
import { FinanceTransactionCategory } from './finance-transaction-category.enum';
import { FinanceTransactionType } from './finance-transaction-type.enum';

const amountTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'finance_transactions' })
@Index('IDX_finance_organization_date', ['organizationId', 'transactionDate'])
@Index('IDX_finance_organization_method_date', ['organizationId', 'method', 'transactionDate'])
@Index('IDX_finance_organization_type_date', ['organizationId', 'type', 'transactionDate'])
export class FinanceTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'order_id', type: 'char', length: 36, nullable: true })
  orderId: string | null;

  @Column({ name: 'transfer_id', type: 'char', length: 36, nullable: true })
  transferId: string | null;

  @Column({ name: 'reconciliation_id', type: 'char', length: 36, nullable: true })
  reconciliationId: string | null;

  @ManyToOne(() => SalesOrder, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder | null;

  @ManyToOne(() => BankReconciliation, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reconciliation_id' })
  reconciliation: BankReconciliation | null;

  @Column({ type: 'enum', enum: FinanceTransactionType })
  type: FinanceTransactionType;

  @Column({ length: 160 })
  label: string;

  @Column({ type: 'enum', enum: FinanceTransactionCategory })
  category: FinanceTransactionCategory;

  @Column({ type: 'enum', enum: FinanceAccountMethod })
  method: FinanceAccountMethod;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 0,
    transformer: amountTransformer,
  })
  amount: number;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.label = this.label.trim();
  }
}
