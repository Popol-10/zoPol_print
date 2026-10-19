import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { Employee } from '../employees/entities/employee.entity';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { ProductionTask } from '../production/entities/production-task.entity';
import { StockItem } from '../stock/entities/stock-item.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      StockItem,
      ProductionTask,
      FinanceTransaction,
      Employee,
      AttendanceRecord,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
