import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateStockItemDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 64)
  @Matches(/^[A-Z0-9][A-Z0-9._-]*$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  reference: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  category: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minimumQuantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  unit: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  unitCost: number;
}
