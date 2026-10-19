import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, Matches } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance-status.enum';

const trimOrNull = (value: unknown): unknown => (typeof value === 'string' ? value.trim() || null : value);

export class UpsertAttendanceDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  checkIn?: string | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  checkOut?: string | null;
}
