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

@Entity({ name: 'suppliers' })
@Index(['organizationId', 'name'])
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 80 })
  category: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 120, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
    this.category = this.category.trim();
    this.contactName = this.contactName?.trim() || null;
    this.phone = this.phone?.trim() || null;
    this.email = this.email?.trim().toLowerCase() || null;
    this.city = this.city?.trim() || null;
    this.notes = this.notes?.trim() || null;
  }
}
