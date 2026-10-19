import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { MaintenanceKind } from '../entities/maintenance-kind.enum';

export class CreateMaintenanceDto {
  @IsUUID()
  machineId: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledFor: string;

  @IsEnum(MaintenanceKind)
  kind: MaintenanceKind;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;
}
