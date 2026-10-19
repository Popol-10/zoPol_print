import { IsDateString, IsInt, Matches, Max, Min } from 'class-validator';

export class UpdateCompensationDto {
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  monthlyBaseSalary: number;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  effectiveFrom: string;
}
