import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../entities/product-category.enum';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 64)
  @Matches(/^[A-Z0-9][A-Z0-9._-]*$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  reference: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999999.99)
  price: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  cost: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  unit: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  machine: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  duration: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color: string;
}
