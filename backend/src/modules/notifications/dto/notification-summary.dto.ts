import { ApiProperty } from '@nestjs/swagger';

export class NotificationSummaryDto {
  @ApiProperty({ description: 'Identifiant d’activité ou d’alerte courante.' })
  id: string;

  title: string;
  detail: string;
  route: string;
  createdAt: Date;
  isRead: boolean;
}

export class NotificationListDto {
  items: NotificationSummaryDto[];
  unreadCount: number;
}

export class NotificationReadResultDto {
  markedRead: number;
}
