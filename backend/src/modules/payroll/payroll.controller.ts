import { Controller, Get, Param, ParseUUIDPipe, Put, Body, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { CompensationSummaryDto } from './dto/compensation-summary.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
@Controller({ path: 'payroll/salaries', version: VERSION_NEUTRAL })
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @ApiOkResponse({ type: CompensationSummaryDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<CompensationSummaryDto[]> {
    return this.payrollService.findAll(actor.organizationId);
  }

  @Put(':employeeId')
  @ApiOkResponse({ type: CompensationSummaryDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateCompensationDto,
  ): Promise<CompensationSummaryDto> {
    return this.payrollService.setCompensation(actor, employeeId, dto);
  }
}
