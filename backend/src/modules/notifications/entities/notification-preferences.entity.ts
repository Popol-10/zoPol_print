import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'notification_preferences' })
export class NotificationPreferences {
  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'low_stock_enabled', type: 'boolean', default: true })
  lowStockEnabled: boolean;

  @Column({ name: 'order_due_enabled', type: 'boolean', default: true })
  orderDueEnabled: boolean;

  @Column({ name: 'maintenance_enabled', type: 'boolean', default: true })
  maintenanceEnabled: boolean;
}
