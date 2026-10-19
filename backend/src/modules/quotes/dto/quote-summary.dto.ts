import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '../entities/quote-status.enum';

export class QuoteSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  productId: string;
  productName: string;
  productReference: string;
  machine: string;
  quantity: number;
  unitPrice: number;
  total: number;

  @ApiProperty({ enum: QuoteStatus })
  status: QuoteStatus;

  @ApiProperty({ type: String, format: 'date' })
  validUntil: string;

  note: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  orderId: string | null;

  orderNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}
