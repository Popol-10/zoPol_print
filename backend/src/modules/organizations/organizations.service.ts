import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { AuditService } from '../audit/audit.service';
import { Organization } from './entities/organization.entity';
import { OrganizationSettingsDto } from './dto/organization-settings.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    private readonly auditService: AuditService,
  ) {}

  async getSettings(actor: AuthenticatedUser): Promise<OrganizationSettingsDto> {
    const organization = await this.findOrganization(actor.organizationId);
    return this.toSettingsDto(organization);
  }

  async updateSettings(
    actor: AuthenticatedUser,
    dto: UpdateOrganizationSettingsDto,
    context?: RequestContext,
  ): Promise<OrganizationSettingsDto> {
    return this.organizationsRepository.manager.transaction(async (manager) => {
      const organizationsRepository = manager.getRepository(Organization);
      const organization = await organizationsRepository.findOneBy({
        id: actor.organizationId,
      });
      if (!organization) throw new NotFoundException('Organisation introuvable.');

      const changedFields: string[] = [];
      const name = dto.name.trim();
      const address = dto.address === undefined ? organization.address : dto.address;

      if (organization.name !== name) {
        organization.name = name;
        changedFields.push('name');
      }
      if (organization.address !== address) {
        organization.address = address;
        changedFields.push('address');
      }
      if (organization.currency !== dto.currency) {
        organization.currency = dto.currency;
        changedFields.push('currency');
      }
      if (organization.timezone !== dto.timezone) {
        organization.timezone = dto.timezone;
        changedFields.push('timezone');
      }

      if (changedFields.length) {
        await organizationsRepository.save(organization);
        await this.auditService.record({
          organizationId: organization.id,
          actorId: actor.id,
          event: AuditEvent.ORGANIZATION_SETTINGS_UPDATED,
          entityType: 'ORGANIZATION',
          entityId: organization.id,
          metadata: { changedFields },
          context,
          manager,
        });
      }

      return this.toSettingsDto(organization);
    });
  }

  private async findOrganization(organizationId: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOneBy({ id: organizationId });
    if (!organization) throw new NotFoundException('Organisation introuvable.');
    return organization;
  }

  private toSettingsDto(organization: Organization): OrganizationSettingsDto {
    return {
      id: organization.id,
      name: organization.name,
      address: organization.address ?? null,
      currency: organization.currency,
      timezone: organization.timezone,
    };
  }
}
