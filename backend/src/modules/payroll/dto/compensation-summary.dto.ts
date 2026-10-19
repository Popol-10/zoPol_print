import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '../../employees/entities/employee-status.enum';

export class CompensationSummaryDto {
  @ApiProperty({ format: 'uuid' })
  employeeId: string;

  employeeName: string;

  position: string;

  @ApiProperty({ enum: EmployeeStatus })
  employeeStatus: EmployeeStatus;

  @ApiProperty({ type: 'integer', nullable: true })
  monthlyBaseSalary: number | null;

  @ApiProperty({ type: 'string', format: 'date', nullable: true })
  effectiveFrom: string | null;
}
