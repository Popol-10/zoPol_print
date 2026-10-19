import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderLineSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  stockItemId: string;
  itemName: string;
  itemReference: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  total: number;
}
