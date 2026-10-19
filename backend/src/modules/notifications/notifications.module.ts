import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { StockItem } from '../stock/entities/stock-item.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { MachineMaintenance } from '../machines/entities/machine-maintenance.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { NotificationRead } from './entities/notification-read.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      NotificationRead,
      NotificationPreferences,
      User,
      StockItem,
      SalesOrder,
      MachineMaintenance,
      Organization,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
