import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { ClientSummaryDto } from './dto/client-summary.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string): Promise<ClientSummaryDto[]> {
    const clients = await this.clientsRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
    return clients.map((client) => this.toSummary(client));
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateClientDto,
  ): Promise<ClientSummaryDto> {
    const client = await this.clientsRepository.save(
      this.clientsRepository.create({
        ...dto,
        organizationId: actor.organizationId,
      }),
    );

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.CLIENT_CREATED,
      entityType: 'CLIENT',
      entityId: client.id,
      metadata: { type: client.type },
    });

    return this.toSummary(client);
  }

  async update(
    actor: AuthenticatedUser,
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<ClientSummaryDto> {
    const client = await this.findForOrganization(actor.organizationId, clientId);
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Indiquez au moins une modification.');
    }
    Object.assign(client, updates);
    const updated = await this.clientsRepository.save(client);

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.CLIENT_UPDATED,
      entityType: 'CLIENT',
      entityId: updated.id,
      metadata: { fields: Object.keys(updates) },
    });

    return this.toSummary(updated);
  }

  async archive(actor: AuthenticatedUser, clientId: string): Promise<void> {
    const client = await this.findForOrganization(actor.organizationId, clientId);
    await this.clientsRepository.softRemove(client);

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.CLIENT_DELETED,
      entityType: 'CLIENT',
      entityId: client.id,
      metadata: { type: client.type },
    });
  }

  private async findForOrganization(
    organizationId: string,
    clientId: string,
  ): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId, organizationId },
    });
    if (!client) throw new NotFoundException('Client introuvable.');
    return client;
  }

  private toSummary(client: Client): ClientSummaryDto {
    return {
      id: client.id,
      name: client.name,
      company: client.company,
      phone: client.phone,
      email: client.email,
      city: client.city,
      type: client.type,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
