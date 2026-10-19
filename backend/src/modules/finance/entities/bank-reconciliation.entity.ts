import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { BankReconciliationStatus } from './bank-reconciliation-status.enum';

const amountTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'bank_reconciliations' })
@Index('IDX_bank_reconciliation_organization_period', ['organizationId', 'periodStart', 'periodEnd'])
@Index('IDX_bank_reconciliation_organization_status', ['organizationId', 'status'])
export class BankReconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({
    name: 'statement_opening_balance',
    type: 'decimal',
    precision: 14,
    scale: 0,
    transformer: amountTransformer,
  })
  statementOpeningBalance: number;

  @Column({
    name: 'statement_closing_balance',
    type: 'decimal',
    precision: 14,
    scale: 0,
    transformer: amountTransformer,
  })
  statementClosingBalance: number;

  @Column({ type: 'enum', enum: BankReconciliationStatus, default: BankReconciliationStatus.OPEN })
  status: BankReconciliationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', precision: 6, nullable: true })
  completedAt: Date | null;
}
