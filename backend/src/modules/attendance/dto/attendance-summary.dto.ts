import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance-status.enum';

export class AttendanceSummaryDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  id: string | null;

  @ApiProperty({ format: 'uuid' })
  employeeId: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  position: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  employeeStatus: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ format: 'date' })
  date: string;

  @ApiProperty({ enum: [...Object.values(AttendanceStatus), 'NOT_RECORDED'] })
  status: AttendanceStatus | 'NOT_RECORDED';

  @ApiPropertyOptional({ nullable: true, example: '08:30:00' })
  checkIn: string | null;

  @ApiPropertyOptional({ nullable: true, example: '17:00:00' })
  checkOut: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Durée entre entrée et sortie, en minutes.' })
  workedMinutes: number | null;
}
