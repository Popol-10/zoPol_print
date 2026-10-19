import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type InvoicePaymentStatus = 'ISSUED' | 'PARTIALLY_PAID' | 'PAID';

export class InvoiceLineSummaryDto {
  id: string;
  productName: string;
  productReference: string;
  machine: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export class InvoiceSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  clientName: string;

  @ApiPropertyOptional({ nullable: true })
  clientCompany: string | null;

  @ApiProperty({ type: String, format: 'date' })
  issuedAt: string;

  total: number;
  paidAmount: number;
  balanceDue: number;

  @ApiProperty({ enum: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] })
  paymentStatus: InvoicePaymentStatus;

  @ApiProperty({ type: InvoiceLineSummaryDto, isArray: true })
  lines: InvoiceLineSummaryDto[];

  createdAt: Date;
}
