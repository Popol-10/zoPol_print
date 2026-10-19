import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class ProductionTaskScheduleDto {
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true, example: '2026-10-20' })
  @IsOptional()
  @IsDateString({ strict: true })
  scheduledDate?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '08:00' })
  @IsOptional()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  scheduledStartTime?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '09:00' })
  @IsOptional()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  scheduledEndTime?: string | null;
}
