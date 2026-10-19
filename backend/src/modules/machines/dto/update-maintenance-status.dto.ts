import { IsEnum } from 'class-validator';
import { MaintenanceStatus } from '../entities/maintenance-status.enum';

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
