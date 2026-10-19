import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceKind } from '../entities/maintenance-kind.enum';
import { MaintenanceStatus } from '../entities/maintenance-status.enum';

export class MaintenanceSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  machineId: string;

  machineName: string;
  scheduledFor: string;

  @ApiProperty({ enum: MaintenanceKind })
  kind: MaintenanceKind;

  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  description: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
