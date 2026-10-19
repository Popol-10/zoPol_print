import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Index({ unique: true })
  @Column({ length: 140 })
  slug: string;

  @Column({ length: 64, default: 'Indian/Antananarivo' })
  timezone: string;

  @Column({ length: 3, default: 'MGA' })
  currency: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeSlug(): void {
    this.slug = this.slug.trim().toLowerCase();
    this.name = this.name.trim();
  }
}
