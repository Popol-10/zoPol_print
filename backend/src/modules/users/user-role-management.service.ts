import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { UserSummaryDto } from './dto/user-summary.dto';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';

@Injectable()
export class UserRoleManagementService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAllByOrganization(organizationId: string): Promise<User[]> {
    return this.dataSource.getRepository(User).find({
      where: { organizationId },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async updateRoles(actor: AuthenticatedUser, userId: string, requestedRoles: UserRole[]): Promise<User> {
    const roles = [...new Set(requestedRoles)];
    const { user, previousRoles } = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const member = await users.findOne({
        where: { id: userId, organizationId: actor.organizationId },
      });

      if (!member) {
        throw new NotFoundException('Membre introuvable dans votre atelier.');
      }

      const removesAdminRole = member.roles.includes(UserRole.ADMIN) && !roles.includes(UserRole.ADMIN);

      if (removesAdminRole && (await this.countAdministrators(actor.organizationId)) <= 1) {
        throw new BadRequestException('Votre atelier doit toujours avoir au moins un administrateur.');
      }

      const previousRoles = [...member.roles];
      member.roles = roles;
      const user = await users.save(member);
      return { user, previousRoles };
    });

    await this.auditService.record({
      organizationId: actor.organizationId,
      actorId: actor.id,
      event: AuditEvent.USER_ROLES_UPDATED,
      entityType: 'USER',
      entityId: user.id,
      metadata: { previousRoles, roles },
    });

    return user;
  }

  toSummary(user: User): UserSummaryDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      roles: user.roles,
      createdAt: user.createdAt,
    };
  }

  private countAdministrators(organizationId: string): Promise<number> {
    return this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.organization_id = :organizationId', { organizationId })
      .andWhere('FIND_IN_SET(:role, user.roles) > 0', { role: UserRole.ADMIN })
      .getCount();
  }
}
