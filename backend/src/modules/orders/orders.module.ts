import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Client } from '../clients/entities/client.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersController } from './orders.controller';
import { SalesOrder } from './entities/sales-order.entity';
import { OrdersService } from './orders.service';
import { ProductionTask } from '../production/entities/production-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder, Client, Product, ProductionTask]), AuditModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
