import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRole } from './user-role.enum';
import { userRolesTransformer } from './user-roles.transformer';
import { UserStatus } from './user-status.enum';

@Entity({ name: 'users' })
@Index(['organizationId', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'first_name', length: 80 })
  firstName: string;

  @Column({ name: 'last_name', length: 80 })
  lastName: string;

  @Index({ unique: true })
  @Column({ length: 190 })
  email: string;

  @Column({ name: 'password_hash', select: false, length: 255 })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: UserRole.VIEWER,
    transformer: userRolesTransformer,
  })
  roles: UserRole[];

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'datetime', precision: 6, nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ name: 'last_login_at', type: 'datetime', precision: 6, nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'password_changed_at', type: 'datetime', precision: 6, nullable: true })
  passwordChangedAt: Date | null;

  @Column({ name: 'refresh_token_hash', type: 'varchar', select: false, length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'refresh_token_expires_at', type: 'datetime', precision: 6, nullable: true })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeIdentity(): void {
    this.email = this.email.trim().toLowerCase();
    this.firstName = this.firstName.trim();
    this.lastName = this.lastName.trim();
  }
}
