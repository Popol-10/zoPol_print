import {
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
import { Machine } from './machine.entity';
import { MachineStatus } from './machine-status.enum';
import { MaintenanceKind } from './maintenance-kind.enum';
import { MaintenanceStatus } from './maintenance-status.enum';

@Entity({ name: 'machine_maintenances' })
@Index(['organizationId', 'scheduledFor', 'status'])
export class MachineMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'machine_id', type: 'char', length: 36 })
  machineId: string;

  @ManyToOne(() => Machine, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ name: 'scheduled_for', type: 'date' })
  scheduledFor: string;

  @Column({ type: 'varchar', length: 16 })
  kind: MaintenanceKind;

  @Column({ type: 'varchar', length: 16, default: MaintenanceStatus.PLANNED })
  status: MaintenanceStatus;

  @Column({ type: 'varchar', length: 512 })
  description: string;

  @Column({ name: 'previous_machine_status', type: 'varchar', length: 16, nullable: true })
  previousMachineStatus: MachineStatus | null;

  @Column({ name: 'completed_at', type: 'datetime', precision: 6, nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
