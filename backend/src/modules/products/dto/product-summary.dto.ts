import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../entities/product-category.enum';

export class ProductSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  reference: string;

  @ApiProperty({ enum: ProductCategory })
  category: ProductCategory;

  @ApiProperty({ type: Number })
  price: number;

  @ApiProperty({ type: Number })
  cost: number;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  machine: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  color: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
