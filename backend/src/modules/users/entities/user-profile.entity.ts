import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  about: string | null;

  @Column({ name: 'profile_photo', type: 'mediumblob', nullable: true, select: false })
  profilePhoto: Buffer | null;

  @Column({ name: 'profile_photo_mime_type', type: 'varchar', length: 32, nullable: true, select: false })
  profilePhotoMimeType: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
