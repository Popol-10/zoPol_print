import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '../entities/purchase-order-status.enum';
import { PurchaseOrderLineSummaryDto } from './purchase-order-line-summary.dto';

export class PurchaseOrderSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  purchaseNumber: string;
  supplierId: string;
  supplierName: string;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status: PurchaseOrderStatus;

  expectedDate: string | null;
  notes: string | null;
  total: number;
  lineCount: number;
  lines: PurchaseOrderLineSummaryDto[];
  createdAt: Date;
  updatedAt: Date;
}
