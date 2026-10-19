import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { AssignProductionTaskDto } from './dto/assign-production-task.dto';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { ProductionTaskSummaryDto } from './dto/production-task-summary.dto';
import { UpdateProductionStageDto } from './dto/update-production-stage.dto';
import { ProductionTaskScheduleDto } from './dto/production-task-schedule.dto';
import { ProductionService } from './production.service';

@ApiTags('Production')
@ApiBearerAuth()
@Controller({ path: 'production', version: VERSION_NEUTRAL })
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('tasks')
  @ApiOkResponse({ type: ProductionTaskSummaryDto, isArray: true })
  listTasks(@CurrentUser() actor: AuthenticatedUser): Promise<ProductionTaskSummaryDto[]> {
    return this.productionService.findAll(actor.organizationId);
  }

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ description: 'Commandes confirmées disponibles pour la planification.' })
  listAvailableOrders(@CurrentUser() actor: AuthenticatedUser) {
    return this.productionService.findAvailableOrders(actor.organizationId);
  }

  @Post('tasks')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiCreatedResponse({ type: ProductionTaskSummaryDto })
  createTask(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateProductionTaskDto,
  ): Promise<ProductionTaskSummaryDto> {
    return this.productionService.createTask(actor, dto);
  }

  @Patch('tasks/:id/assignee')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ type: ProductionTaskSummaryDto })
  assignTask(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: AssignProductionTaskDto,
  ): Promise<ProductionTaskSummaryDto> {
    return this.productionService.assignTask(actor, taskId, dto);
  }

  @Patch('tasks/:id/schedule')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ type: ProductionTaskSummaryDto })
  updateSchedule(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: ProductionTaskScheduleDto,
  ): Promise<ProductionTaskSummaryDto> {
    return this.productionService.updateSchedule(actor, taskId, dto);
  }

  @Patch('tasks/:id/stage')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR)
  @ApiOkResponse({ type: ProductionTaskSummaryDto })
  updateStage(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateProductionStageDto,
  ): Promise<ProductionTaskSummaryDto> {
    return this.productionService.updateStage(actor, taskId, dto);
  }
}
