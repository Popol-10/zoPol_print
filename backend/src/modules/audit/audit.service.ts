import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuditEvent } from './entities/audit-event.enum';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogInput {
  organizationId?: string | null;
  actorId?: string | null;
  event: AuditEvent;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  context?: RequestContext;
  manager?: EntityManager;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async record(input: CreateAuditLogInput): Promise<void> {
    const repository = input.manager?.getRepository(AuditLog) ?? this.auditRepository;
    await repository.save(
      repository.create({
        organizationId: input.organizationId ?? null,
        actorId: input.actorId ?? null,
        event: input.event,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? null,
        ipAddress: input.context?.ip ?? null,
        userAgent: input.context?.userAgent?.slice(0, 512) ?? null,
      }),
    );
  }
}
