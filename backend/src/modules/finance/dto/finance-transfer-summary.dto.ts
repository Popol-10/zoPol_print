import { ApiProperty } from '@nestjs/swagger';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';

export class FinanceTransferSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: FinanceAccountMethod })
  sourceMethod: FinanceAccountMethod;

  @ApiProperty({ enum: FinanceAccountMethod })
  destinationMethod: FinanceAccountMethod;

  @ApiProperty({ type: 'integer' })
  amount: number;

  label: string;

  transactionDate: string;
}
