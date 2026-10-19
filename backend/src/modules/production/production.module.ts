import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Employee } from '../employees/entities/employee.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { ProductionController } from './production.controller';
import { ProductionTask } from './entities/production-task.entity';
import { ProductionService } from './production.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionTask, SalesOrder, Employee, Organization]), AuditModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
