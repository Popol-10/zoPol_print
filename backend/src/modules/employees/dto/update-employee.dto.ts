import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { EmployeeStatus } from '../entities/employee-status.enum';

const trimOrNull = (value: unknown): unknown => (typeof value === 'string' ? value.trim() || null : value);

export class UpdateEmployeeDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @Length(5, 190)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() || null : value,
  )
  email?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
