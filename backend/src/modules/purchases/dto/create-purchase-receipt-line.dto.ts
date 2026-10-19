import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreatePurchaseReceiptLineDto {
  @IsUUID()
  purchaseOrderLineId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  quantity: number;
}
