import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderPriority } from '../entities/order-priority.enum';
import { OrderStatus } from '../entities/order-status.enum';

export class OrderSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  orderNumber: string;
  clientId: string;
  clientName: string;

  @ApiPropertyOptional({ nullable: true })
  clientCompany: string | null;

  productId: string;
  productName: string;
  productReference: string;
  machine: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: Number })
  unitPrice: number;

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  paidAmount: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: OrderPriority })
  priority: OrderPriority;

  @ApiProperty({ format: 'date-time' })
  orderedAt: Date;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-10-15' })
  dueDate: string | null;

  operatorName: string;
  createdAt: Date;
  updatedAt: Date;
}
