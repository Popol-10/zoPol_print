import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class CreatePurchaseOrderLineDto {
  @IsUUID()
  stockItemId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4_294_967_295)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999_999_999_999.99)
  unitCost: number;
}
