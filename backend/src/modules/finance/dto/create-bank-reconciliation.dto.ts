import { Type } from 'class-transformer';
import { IsDateString, IsInt, Matches, Max, Min } from 'class-validator';

export class CreateBankReconciliationDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodStart: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodEnd: string;

  @Type(() => Number)
  @IsInt()
  @Min(-1_000_000_000_000)
  @Max(1_000_000_000_000)
  statementOpeningBalance: number;

  @Type(() => Number)
  @IsInt()
  @Min(-1_000_000_000_000)
  @Max(1_000_000_000_000)
  statementClosingBalance: number;
}
