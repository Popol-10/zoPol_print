import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ClientType } from '../entities/client-type.enum';

const trimOrNull = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  company?: string | null;

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

  @IsEnum(ClientType)
  type: ClientType;
}
