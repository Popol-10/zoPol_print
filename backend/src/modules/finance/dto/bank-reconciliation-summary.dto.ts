import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BankReconciliationStatus } from '../entities/bank-reconciliation-status.enum';

export class BankReconciliationSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  periodStart: string;

  periodEnd: string;

  @ApiProperty({ type: 'integer' })
  statementOpeningBalance: number;

  @ApiProperty({ type: 'integer' })
  statementClosingBalance: number;

  @ApiProperty({ type: 'integer' })
  calculatedClosingBalance: number;

  @ApiProperty({ type: 'integer' })
  difference: number;

  @ApiProperty({ type: 'integer' })
  matchedCount: number;

  @ApiProperty({ type: 'integer' })
  transactionCount: number;

  @ApiProperty({ enum: BankReconciliationStatus })
  status: BankReconciliationStatus;

  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  completedAt: Date | null;
}
