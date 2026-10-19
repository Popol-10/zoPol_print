import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateMemberDto } from './dto/create-member.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { UserRole } from './entities/user-role.enum';
import { UserMemberCreationService } from './user-member-creation.service';
import { UserRoleManagementService } from './user-role-management.service';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'users', version: VERSION_NEUTRAL })
export class UserMemberCreationController {
  constructor(
    private readonly memberCreationService: UserMemberCreationService,
    private readonly roleManagementService: UserRoleManagementService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: UserSummaryDto })
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateMemberDto,
  ): Promise<UserSummaryDto> {
    const user = await this.memberCreationService.create(actor, dto);
    return this.roleManagementService.toSummary(user);
  }
}
