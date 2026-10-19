import { IsEnum } from 'class-validator';
import { MachineStatus } from '../entities/machine-status.enum';

export class UpdateMachineStatusDto {
  @IsEnum(MachineStatus)
  status: MachineStatus;
}
