import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

const trimOrNull = (value: unknown): unknown => (typeof value === 'string' ? value.trim() || null : value);

export class CreateEmployeeTaskDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 160)
  title: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  description?: string | null;
}
