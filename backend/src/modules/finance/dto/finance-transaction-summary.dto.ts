import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';
import { FinanceTransactionCategory } from '../entities/finance-transaction-category.enum';
import { FinanceTransactionType } from '../entities/finance-transaction-type.enum';

export class FinanceTransactionSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  orderId: string | null;

  @ApiPropertyOptional({ nullable: true })
  orderNumber: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  transferId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  reconciliationId: string | null;

  @ApiProperty({ enum: FinanceTransactionType })
  type: FinanceTransactionType;

  label: string;

  @ApiProperty({ enum: FinanceTransactionCategory })
  category: FinanceTransactionCategory;

  @ApiProperty({ enum: FinanceAccountMethod })
  method: FinanceAccountMethod;

  @ApiProperty({ type: 'integer' })
  amount: number;

  transactionDate: string;

  createdAt: Date;
}
