import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceTransaction } from './entities/finance-transaction.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { BankReconciliation } from './entities/bank-reconciliation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceTransaction, SalesOrder, BankReconciliation]), AuditModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
