import { Injectable } from '@nestjs/common';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { User } from '../users/entities/user.entity';
import { PasswordResetDeliveryHook } from './password-reset-delivery.hook';

/**
 * Point d'extension des effets secondaires liés à l'authentification.
 * Les futurs e-mails, notifications ou webhooks sont ajoutés ici sans alourdir AuthService.
 */
@Injectable()
export class AuthLifecycleHooks {
  constructor(
    private readonly auditService: AuditService,
    private readonly passwordResetDelivery: PasswordResetDeliveryHook,
  ) {}

  onRegistered(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_REGISTERED, context);
  }

  onLoggedIn(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_LOGGED_IN, context);
  }

  onRefreshed(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_REFRESHED, context);
  }

  onLoggedOut(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_LOGGED_OUT, context);
  }

  async onPasswordResetRequested(user: User, rawToken: string, context?: RequestContext): Promise<void> {
    await this.record(user, AuditEvent.AUTH_PASSWORD_RESET_REQUESTED, context);
    await this.passwordResetDelivery.send(user, rawToken);
  }

  onPasswordResetCompleted(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_PASSWORD_RESET_COMPLETED, context);
  }

  onPasswordChanged(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.AUTH_PASSWORD_CHANGED, context);
  }

  onProfileUpdated(user: User, context?: RequestContext): Promise<void> {
    return this.record(user, AuditEvent.USER_PROFILE_UPDATED, context);
  }

  private record(user: User, event: AuditEvent, context?: RequestContext): Promise<void> {
    return this.auditService.record({
      organizationId: user.organizationId,
      actorId: user.id,
      event,
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email },
      context,
    });
  }
}
