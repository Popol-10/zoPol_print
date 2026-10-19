import { ApiProperty } from '@nestjs/swagger';
import { FinanceTransactionSummaryDto } from './finance-transaction-summary.dto';

export class FinanceTransactionPageDto {
  @ApiProperty({ type: FinanceTransactionSummaryDto, isArray: true })
  items: FinanceTransactionSummaryDto[];

  total: number;

  page: number;

  pageSize: number;
}
