import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Client } from '../clients/entities/client.entity';
import { MailModule } from '../mail/mail.module';
import { Organization } from '../organizations/entities/organization.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { Product } from '../products/entities/product.entity';
import { Quote } from './entities/quote.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, Client, Organization, Product, SalesOrder]),
    AuditModule,
    MailModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
