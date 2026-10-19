import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'notification_reads' })
export class NotificationRead {
  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'notification_id', type: 'varchar', length: 190 })
  notificationId: string;

  @CreateDateColumn({ name: 'read_at', type: 'datetime', precision: 6 })
  readAt: Date;
}
