import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { UserRole } from './entities/user-role.enum';
import { UserRoleManagementService } from './user-role-management.service';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'users', version: VERSION_NEUTRAL })
export class UsersController {
  constructor(private readonly roleManagementService: UserRoleManagementService) {}

  @Get()
  @ApiOkResponse({ type: UserSummaryDto, isArray: true })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<UserSummaryDto[]> {
    const members = await this.roleManagementService.findAllByOrganization(user.organizationId);
    return members.map((member) => this.roleManagementService.toSummary(member));
  }

  @Patch(':id/roles')
  @ApiOkResponse({ type: UserSummaryDto })
  async updateRoles(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UserSummaryDto> {
    const user = await this.roleManagementService.updateRoles(actor, userId, dto.roles);
    return this.roleManagementService.toSummary(user);
  }
}
