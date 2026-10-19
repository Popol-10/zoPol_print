import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AttendanceSummaryDto } from './dto/attendance-summary.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
@Controller({ path: 'attendance', version: VERSION_NEUTRAL })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiQuery({ name: 'date', required: true, example: '2026-09-30' })
  @ApiOkResponse({ type: AttendanceSummaryDto, isArray: true })
  listDaily(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AttendanceQueryDto,
  ): Promise<AttendanceSummaryDto[]> {
    return this.attendanceService.findDaily(actor.organizationId, query.date);
  }

  @Put(':employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOkResponse({ type: AttendanceSummaryDto })
  upsert(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpsertAttendanceDto,
  ): Promise<AttendanceSummaryDto> {
    return this.attendanceService.upsert(actor, employeeId, dto);
  }
}
