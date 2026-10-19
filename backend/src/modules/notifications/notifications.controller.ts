import { Body, Controller, Get, Post, Put, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationListDto, NotificationReadResultDto } from './dto/notification-summary.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: VERSION_NEUTRAL })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOkResponse({ type: NotificationListDto })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<NotificationListDto> {
    return this.notificationsService.list(actor);
  }

  @Get('preferences')
  @ApiOkResponse({ type: NotificationPreferencesDto })
  getPreferences(@CurrentUser() actor: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    return this.notificationsService.getPreferences(actor);
  }

  @Put('preferences')
  @ApiOkResponse({ type: NotificationPreferencesDto })
  updatePreferences(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.updatePreferences(actor, dto);
  }

  @Post('read')
  @ApiOkResponse({ type: NotificationReadResultDto })
  markRead(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: MarkNotificationsReadDto,
  ): Promise<NotificationReadResultDto> {
    return this.notificationsService.markRead(actor, dto);
  }
}
