import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { StockItem } from '../stock/entities/stock-item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseReceipt } from './entities/purchase-receipt.entity';
import { PurchaseReceiptLine } from './entities/purchase-receipt-line.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      PurchaseReceipt,
      PurchaseReceiptLine,
      Supplier,
      StockItem,
    ]),
    AuditModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
