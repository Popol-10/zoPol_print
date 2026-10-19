import { ApiProperty } from '@nestjs/swagger';
import { StockMovementSummaryDto } from './stock-movement-summary.dto';

export class StockMovementPageDto {
  @ApiProperty({ type: StockMovementSummaryDto, isArray: true })
  items: StockMovementSummaryDto[];

  total: number;
  page: number;
  pageSize: number;
}
