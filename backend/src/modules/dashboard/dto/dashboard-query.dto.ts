import { IsIn, IsOptional } from 'class-validator';

export type DashboardPeriod = 'month' | 'quarter' | 'year';

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(['month', 'quarter', 'year'])
  period?: DashboardPeriod;
}
