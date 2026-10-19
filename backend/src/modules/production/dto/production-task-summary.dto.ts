import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderPriority } from '../../orders/entities/order-priority.enum';
import { ProductionTaskStage } from '../entities/production-task-stage.enum';

export class ProductionTaskSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  orderId: string;

  orderNumber: string;
  customer: string;
  product: string;
  quantity: number;
  machine: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  employeeId: string | null;

  operatorName: string;

  @ApiProperty({ enum: OrderPriority })
  priority: OrderPriority;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-10-15' })
  dueDate: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  scheduledDate: string | null;

  @ApiProperty({ type: String, nullable: true, example: '08:00' })
  scheduledStartTime: string | null;

  @ApiProperty({ type: String, nullable: true, example: '09:00' })
  scheduledEndTime: string | null;

  @ApiProperty({ enum: ProductionTaskStage })
  stage: ProductionTaskStage;

  createdAt: Date;
  updatedAt: Date;
}
