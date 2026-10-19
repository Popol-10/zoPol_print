import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MachineStatus } from '../entities/machine-status.enum';

export class MachineSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  name: string;
  type: string;

  @ApiProperty({ enum: MachineStatus })
  status: MachineStatus;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-10-02' })
  nextMaintenanceAt: string | null;

  createdAt: Date;
  updatedAt: Date;
}
