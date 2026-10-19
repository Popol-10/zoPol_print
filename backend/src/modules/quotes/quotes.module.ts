import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Client } from '../clients/entities/client.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { Product } from '../products/entities/product.entity';
import { Quote } from './entities/quote.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Client, Product, SalesOrder]), AuditModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
