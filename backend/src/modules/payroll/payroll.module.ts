import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeCompensation } from './entities/employee-compensation.entity';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeCompensation, Employee]), AuditModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
