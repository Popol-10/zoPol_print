import { IsEnum } from 'class-validator';
import { ProductionTaskStage } from '../entities/production-task-stage.enum';

export class UpdateProductionStageDto {
  @IsEnum(ProductionTaskStage)
  stage: ProductionTaskStage;
}
