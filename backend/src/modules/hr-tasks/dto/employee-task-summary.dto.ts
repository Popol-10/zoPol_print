import { ApiProperty } from '@nestjs/swagger';
import { EmployeeTaskStatus } from '../entities/employee-task-status.enum';

export class EmployeeTaskSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  title: string;

  description: string | null;

  dueDate: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  employeeId: string | null;

  employeeName: string | null;

  @ApiProperty({ enum: EmployeeTaskStatus })
  status: EmployeeTaskStatus;

  createdAt: Date;

  updatedAt: Date;
}
