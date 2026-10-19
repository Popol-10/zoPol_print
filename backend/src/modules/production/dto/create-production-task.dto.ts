import { IsUUID } from 'class-validator';
import { ProductionTaskScheduleDto } from './production-task-schedule.dto';

export class CreateProductionTaskDto extends ProductionTaskScheduleDto {
  @IsUUID()
  orderId: string;
}
