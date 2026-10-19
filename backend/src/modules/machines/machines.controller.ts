import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MachineSummaryDto } from './dto/machine-summary.dto';
import { MaintenanceSummaryDto } from './dto/maintenance-summary.dto';
import { UpdateMachineStatusDto } from './dto/update-machine-status.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MachinesService } from './machines.service';

@ApiTags('Machines')
@ApiBearerAuth()
@Controller({ path: 'machines', version: VERSION_NEUTRAL })
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  @ApiOkResponse({ type: MachineSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<MachineSummaryDto[]> {
    return this.machinesService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiCreatedResponse({ type: MachineSummaryDto })
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateMachineDto): Promise<MachineSummaryDto> {
    return this.machinesService.create(actor, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ type: MachineSummaryDto })
  updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) machineId: string,
    @Body() dto: UpdateMachineStatusDto,
  ): Promise<MachineSummaryDto> {
    return this.machinesService.updateStatus(actor, machineId, dto);
  }

  @Get('maintenance')
  @ApiOkResponse({ type: MaintenanceSummaryDto, isArray: true })
  listMaintenance(@CurrentUser() actor: AuthenticatedUser): Promise<MaintenanceSummaryDto[]> {
    return this.machinesService.findMaintenance(actor.organizationId);
  }

  @Post('maintenance')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiCreatedResponse({ type: MaintenanceSummaryDto })
  createMaintenance(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateMaintenanceDto,
  ): Promise<MaintenanceSummaryDto> {
    return this.machinesService.createMaintenance(actor, dto);
  }

  @Patch('maintenance/:id/status')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  @ApiOkResponse({ type: MaintenanceSummaryDto })
  updateMaintenanceStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) maintenanceId: string,
    @Body() dto: UpdateMaintenanceStatusDto,
  ): Promise<MaintenanceSummaryDto> {
    return this.machinesService.updateMaintenanceStatus(actor, maintenanceId, dto);
  }
}
