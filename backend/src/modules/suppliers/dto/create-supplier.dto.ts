import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

const trimOrNull = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  contactName?: string | null;

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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  notes?: string | null;
}
