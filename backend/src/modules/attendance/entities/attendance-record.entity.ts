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
import { AttendanceStatus } from './attendance-status.enum';

@Entity({ name: 'attendance_records' })
@Index('UQ_attendance_employee_date', ['employeeId', 'attendanceDate'], { unique: true })
@Index('IDX_attendance_organization_date', ['organizationId', 'attendanceDate'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'employee_id', type: 'char', length: 36 })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate: string;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ name: 'check_in', type: 'time', nullable: true })
  checkIn: string | null;

  @Column({ name: 'check_out', type: 'time', nullable: true })
  checkOut: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
