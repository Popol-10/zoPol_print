import {
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
import { Employee } from '../../employees/entities/employee.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { EmployeeTaskStatus } from './employee-task-status.enum';

@Entity({ name: 'employee_tasks' })
@Index('IDX_employee_tasks_organization_due', ['organizationId', 'dueDate'])
@Index('IDX_employee_tasks_employee', ['employeeId'])
export class EmployeeTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'employee_id', type: 'char', length: 36, nullable: true })
  employeeId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'enum', enum: EmployeeTaskStatus, default: EmployeeTaskStatus.TODO })
  status: EmployeeTaskStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;
}
