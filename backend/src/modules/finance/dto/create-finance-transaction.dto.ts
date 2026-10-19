import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';
import { FinanceTransactionCategory } from '../entities/finance-transaction-category.enum';
import { FinanceTransactionType } from '../entities/finance-transaction-type.enum';

export class CreateFinanceTransactionDto {
  @IsIn([
    FinanceTransactionType.INCOME,
    FinanceTransactionType.EXPENSE,
    FinanceTransactionType.OPENING_BALANCE,
  ])
  type: FinanceTransactionType;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  label: string;

  @IsOptional()
  @IsEnum(FinanceTransactionCategory)
  category?: FinanceTransactionCategory;

  @IsEnum(FinanceAccountMethod)
  method: FinanceAccountMethod;

  @IsInt()
  @Min(1)
  @Max(1_000_000_000_000)
  amount: number;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  transactionDate: string;
}
