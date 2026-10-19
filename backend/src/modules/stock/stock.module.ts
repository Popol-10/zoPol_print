import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { StockItem } from './entities/stock-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockItem, StockMovement]), AuditModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
