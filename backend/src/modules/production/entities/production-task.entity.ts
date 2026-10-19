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
import { Employee } from '../../employees/entities/employee.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { ProductionTaskStage } from './production-task-stage.enum';

@Entity({ name: 'production_tasks' })
@Index(['orderId'], { unique: true })
@Index(['organizationId', 'stage'])
@Index('IDX_production_tasks_employee', ['employeeId'])
@Index('IDX_production_tasks_schedule', ['organizationId', 'scheduledDate', 'stage'])
export class ProductionTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'order_id', type: 'char', length: 36 })
  orderId: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column({ name: 'employee_id', type: 'char', length: 36, nullable: true })
  employeeId: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: string | null;

  @Column({ name: 'scheduled_start_time', type: 'time', nullable: true })
  scheduledStartTime: string | null;

  @Column({ name: 'scheduled_end_time', type: 'time', nullable: true })
  scheduledEndTime: string | null;

  @Column({ name: 'operator_name', type: 'varchar', length: 120, default: 'À attribuer' })
  operatorName: string;

  @Column({ type: 'varchar', length: 32, default: ProductionTaskStage.TO_PRODUCE })
  stage: ProductionTaskStage;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
