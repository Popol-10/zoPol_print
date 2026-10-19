import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Employee } from '../employees/entities/employee.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord } from './entities/attendance-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, Employee]), AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
