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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeSummaryDto } from './dto/employee-summary.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller({ path: 'employees', version: VERSION_NEUTRAL })
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOkResponse({ type: EmployeeSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<EmployeeSummaryDto[]> {
    return this.employeesService.findAll(actor.organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiCreatedResponse({ type: EmployeeSummaryDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ): Promise<EmployeeSummaryDto> {
    return this.employeesService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOkResponse({ type: EmployeeSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeSummaryDto> {
    return this.employeesService.update(actor, employeeId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @HttpCode(204)
  @ApiNoContentResponse()
  archive(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) employeeId: string,
  ): Promise<void> {
    return this.employeesService.archive(actor, employeeId);
  }
}
