import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeTask } from './entities/employee-task.entity';
import { HrTasksController } from './hr-tasks.controller';
import { HrTasksService } from './hr-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeTask, Employee]), AuditModule],
  controllers: [HrTasksController],
  providers: [HrTasksService],
})
export class HrTasksModule {}
