import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateEmployeeTaskDto } from './create-employee-task.dto';
import { EmployeeTaskStatus } from '../entities/employee-task-status.enum';

export class UpdateEmployeeTaskDto extends PartialType(CreateEmployeeTaskDto) {
  @IsOptional()
  @IsEnum(EmployeeTaskStatus)
  status?: EmployeeTaskStatus;
}
