import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../orders/entities/order-status.enum';

export class InvoiceEligibleOrderDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  orderNumber: string;
  clientName: string;

  @ApiPropertyOptional({ nullable: true })
  clientCompany: string | null;

  productName: string;
  productReference: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paidAmount: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  orderedAt: Date;
}
