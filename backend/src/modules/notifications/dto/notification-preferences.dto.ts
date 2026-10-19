import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class NotificationPreferencesDto {
  @ApiProperty({ default: true })
  lowStockEnabled: boolean;

  @ApiProperty({ default: true })
  orderDueEnabled: boolean;

  @ApiProperty({ default: true })
  maintenanceEnabled: boolean;
}

export class UpdateNotificationPreferencesDto implements NotificationPreferencesDto {
  @IsBoolean()
  lowStockEnabled: boolean;

  @IsBoolean()
  orderDueEnabled: boolean;

  @IsBoolean()
  maintenanceEnabled: boolean;
}
