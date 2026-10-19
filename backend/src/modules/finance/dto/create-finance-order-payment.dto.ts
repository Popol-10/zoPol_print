import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, Matches, Max, Min } from 'class-validator';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';

export class CreateFinanceOrderPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000_000)
  amount: number;

  @IsEnum(FinanceAccountMethod)
  method: FinanceAccountMethod;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  transactionDate: string;
}
