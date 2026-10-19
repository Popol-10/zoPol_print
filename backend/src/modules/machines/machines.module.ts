import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { Machine } from './entities/machine.entity';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Machine, MachineMaintenance]), AuditModule],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
