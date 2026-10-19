import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AuditEvent } from './audit-event.enum';

@Entity({ name: 'audit_logs' })
@Index(['organizationId', 'createdAt'])
@Index(['actorId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36, nullable: true })
  organizationId: string | null;

  @Column({ name: 'actor_id', type: 'char', length: 36, nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 64 })
  event: AuditEvent;

  @Column({ name: 'entity_type', length: 64 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'char', length: 36, nullable: true })
  entityId: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
