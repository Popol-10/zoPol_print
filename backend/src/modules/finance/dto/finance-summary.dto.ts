import { FinanceMonthSummaryDto } from './finance-month-summary.dto';

export class FinanceSummaryDto {
  totalIncome: number;

  totalExpenses: number;

  totalBalance: number;

  cashBalance: number;

  bankBalance: number;

  mobileMoneyBalance: number;

  monthly: FinanceMonthSummaryDto[];
}
