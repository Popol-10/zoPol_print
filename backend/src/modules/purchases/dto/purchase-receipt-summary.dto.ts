import { ApiProperty } from '@nestjs/swagger';

export class PurchaseReceiptLineSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  purchaseOrderLineId: string;
  stockItemId: string;
  itemName: string;
  itemReference: string;
  unit: string;
  quantity: number;
}

export class PurchaseReceiptSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  receiptNumber: string;
  purchaseOrderId: string;
  purchaseNumber: string;
  supplierName: string;
  deliveryReference: string | null;
  notes: string | null;
  actorName: string;
  receivedAt: Date;
  lines: PurchaseReceiptLineSummaryDto[];
}
