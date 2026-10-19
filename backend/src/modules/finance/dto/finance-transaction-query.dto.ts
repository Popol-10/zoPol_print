import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';
import { FinanceTransactionType } from '../entities/finance-transaction-type.enum';

export class FinanceTransactionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 15;

  @IsOptional()
  @IsEnum(FinanceTransactionType)
  type?: FinanceTransactionType;

  @IsOptional()
  @IsEnum(FinanceAccountMethod)
  method?: FinanceAccountMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
