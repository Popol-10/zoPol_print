import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: VERSION_NEUTRAL })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOkResponse({ type: DashboardSummaryDto })
  getSummary(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(actor, query.period ?? 'month');
  }
}
