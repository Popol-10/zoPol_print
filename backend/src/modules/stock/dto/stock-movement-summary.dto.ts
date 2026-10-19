import { ApiProperty } from '@nestjs/swagger';
import { StockMovementKind } from '../entities/stock-movement-kind.enum';

export class StockMovementSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  itemId: string;
  itemName: string;
  itemReference: string;
  kind: StockMovementKind;

  @ApiProperty({ type: Number })
  delta: number;

  @ApiProperty({ type: Number })
  beforeQuantity: number;

  @ApiProperty({ type: Number })
  afterQuantity: number;

  actorName: string;
  source: string | null;
  notes: string | null;
  createdAt: Date;
}
