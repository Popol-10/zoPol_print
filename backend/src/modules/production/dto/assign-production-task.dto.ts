import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignProductionTaskDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUUID()
  employeeId?: string | null;
}
