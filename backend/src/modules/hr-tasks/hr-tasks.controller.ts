import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateEmployeeTaskDto } from './dto/create-employee-task.dto';
import { EmployeeTaskSummaryDto } from './dto/employee-task-summary.dto';
import { UpdateEmployeeTaskDto } from './dto/update-employee-task.dto';
import { HrTasksService } from './hr-tasks.service';

@ApiTags('HR tasks')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
@Controller({ path: 'hr/tasks', version: VERSION_NEUTRAL })
export class HrTasksController {
  constructor(private readonly hrTasksService: HrTasksService) {}

  @Get()
  @ApiOkResponse({ type: EmployeeTaskSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<EmployeeTaskSummaryDto[]> {
    return this.hrTasksService.findAll(actor.organizationId);
  }

  @Post()
  @ApiCreatedResponse({ type: EmployeeTaskSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateEmployeeTaskDto,
  ): Promise<EmployeeTaskSummaryDto> {
    return this.hrTasksService.create(actor, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: EmployeeTaskSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateEmployeeTaskDto,
  ): Promise<EmployeeTaskSummaryDto> {
    return this.hrTasksService.update(actor, taskId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  archive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    return this.hrTasksService.archive(actor, taskId);
  }
}
