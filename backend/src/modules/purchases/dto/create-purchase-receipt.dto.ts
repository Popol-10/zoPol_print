import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseReceiptLineDto } from './create-purchase-receipt-line.dto';

const trimOrNull = (value: unknown): unknown => (typeof value === 'string' ? value.trim() || null : value);

export class CreatePurchaseReceiptDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  deliveryReference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  notes?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReceiptLineDto)
  lines: CreatePurchaseReceiptLineDto[];
}
