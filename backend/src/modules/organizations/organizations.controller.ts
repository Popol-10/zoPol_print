import { Body, Controller, Get, Put, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { UserRole } from '../users/entities/user-role.enum';
import { OrganizationSettingsDto } from './dto/organization-settings.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller({ path: 'organizations', version: VERSION_NEUTRAL })
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me/settings')
  @ApiOkResponse({ type: OrganizationSettingsDto })
  getSettings(@CurrentUser() actor: AuthenticatedUser): Promise<OrganizationSettingsDto> {
    return this.organizationsService.getSettings(actor);
  }

  @Put('me/settings')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ type: OrganizationSettingsDto })
  updateSettings(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateOrganizationSettingsDto,
    @Req() request: Request,
  ): Promise<OrganizationSettingsDto> {
    return this.organizationsService.updateSettings(actor, dto, this.requestContext(request));
  }

  private requestContext(request: Request): RequestContext {
    const userAgent = request.headers['user-agent'];
    return {
      ip: request.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    };
  }
}
