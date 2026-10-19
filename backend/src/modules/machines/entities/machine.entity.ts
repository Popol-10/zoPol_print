import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { MachineStatus } from './machine-status.enum';

@Entity({ name: 'machines' })
@Index(['organizationId', 'name'], { unique: true })
@Index(['organizationId', 'status'])
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'machine_type', type: 'varchar', length: 80 })
  type: string;

  @Column({ type: 'varchar', length: 16, default: MachineStatus.ACTIVE })
  status: MachineStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.name = this.name.trim();
    this.type = this.type.trim();
  }
}
