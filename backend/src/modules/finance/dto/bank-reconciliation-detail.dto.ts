import { ApiProperty } from '@nestjs/swagger';
import { FinanceTransactionSummaryDto } from './finance-transaction-summary.dto';
import { BankReconciliationSummaryDto } from './bank-reconciliation-summary.dto';

export class BankReconciliationDetailDto extends BankReconciliationSummaryDto {
  @ApiProperty({ type: FinanceTransactionSummaryDto, isArray: true })
  transactions: FinanceTransactionSummaryDto[];
}
