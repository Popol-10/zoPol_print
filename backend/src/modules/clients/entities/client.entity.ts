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
import { ClientType } from './client-type.enum';

@Entity({ name: 'clients' })
@Index(['organizationId', 'name'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.INDIVIDUAL })
  type: ClientType;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.name = this.name.trim();
    this.company = this.company?.trim() || null;
    this.phone = this.phone?.trim() || null;
    this.email = this.email?.trim().toLowerCase() || null;
    this.city = this.city?.trim() || null;
  }
}
