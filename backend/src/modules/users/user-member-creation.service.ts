import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CreateMemberDto } from './dto/create-member.dto';
import { User } from './entities/user.entity';
import { UserStatus } from './entities/user-status.enum';

@Injectable()
export class UserMemberCreationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async create(actor: AuthenticatedUser, dto: CreateMemberDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();

    try {
      const user = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const existingUser = await users.exists({ where: { email } });

        if (existingUser) {
          throw new ConflictException('Un compte utilise déjà cette adresse e-mail.');
        }

        const member = users.create({
          organizationId: actor.organizationId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email,
          passwordHash: await argon2.hash(dto.temporaryPassword, {
            type: argon2.argon2id,
          }),
          passwordChangedAt: new Date(),
          roles: [...new Set(dto.roles)],
          status: UserStatus.ACTIVE,
        });

        return users.save(member);
      });

      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.USER_CREATED,
        entityType: 'USER',
        entityId: user.id,
        metadata: { email: user.email, roles: user.roles },
      });

      return user;
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException('Un compte utilise déjà cette adresse e-mail.');
      }
      throw error;
    }
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      error instanceof QueryFailedError && (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
