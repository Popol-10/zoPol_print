import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { OrderPriority } from '../entities/order-priority.enum';

export class CreateOrderDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity: number;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim();
    return normalized.toLocaleLowerCase('fr') === 'urgent' ? OrderPriority.URGENT : normalized;
  })
  @IsEnum(OrderPriority)
  priority: OrderPriority;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  dueDate?: string | null;
}
