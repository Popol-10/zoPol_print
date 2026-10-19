import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateQuoteDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  unitPrice: number;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  validUntil: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  note?: string | null;
}
