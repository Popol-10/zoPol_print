import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FinanceAccountMethod } from '../entities/finance-account-method.enum';

export class CreateFinanceTransferDto {
  @IsEnum(FinanceAccountMethod)
  sourceMethod: FinanceAccountMethod;

  @IsEnum(FinanceAccountMethod)
  destinationMethod: FinanceAccountMethod;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000_000)
  amount: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label?: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  transactionDate: string;
}
