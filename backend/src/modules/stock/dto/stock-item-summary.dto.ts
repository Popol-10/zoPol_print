import { ApiProperty } from '@nestjs/swagger';

export class StockItemSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  name: string;
  reference: string;
  category: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: Number })
  minimumQuantity: number;

  unit: string;

  @ApiProperty({ type: Number })
  unitCost: number;

  @ApiProperty({ type: Number })
  value: number;

  status: string;
  createdAt: Date;
  updatedAt: Date;
}
