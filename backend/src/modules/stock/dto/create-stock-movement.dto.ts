import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StockAdjustmentDirection, StockMovementKind } from '../entities/stock-movement-kind.enum';

const trimOrNull = (value: unknown): unknown => (typeof value === 'string' ? value.trim() || null : value);

export class CreateStockMovementDto {
  @IsUUID()
  itemId: string;

  @IsEnum(StockMovementKind)
  kind: StockMovementKind;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity: number;

  @IsOptional()
  @IsEnum(StockAdjustmentDirection)
  direction?: StockAdjustmentDirection;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  source?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  notes?: string | null;
}
