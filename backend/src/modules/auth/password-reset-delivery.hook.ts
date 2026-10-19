import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/environment.validation';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PasswordResetDeliveryHook {
  private readonly logger = new Logger(PasswordResetDeliveryHook.name);

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly mailService: MailService,
  ) {}

  async send(user: User, rawToken: string): Promise<void> {
    const resetUrl = new URL(this.config.getOrThrow<string>('RESET_PASSWORD_URL'));
    resetUrl.searchParams.set('token', rawToken);

    if (!this.mailService.isEnabled()) {
      if (this.config.getOrThrow<string>('NODE_ENV') !== 'production') {
        this.logger.warn('[development only] Reset link for ' + user.email + ': ' + resetUrl.toString());
      } else {
        this.logger.error('SMTP is disabled; no password reset email was sent.');
      }
      return;
    }

    try {
      await this.mailService.sendPasswordReset({
        recipient: user.email,
        resetUrl: resetUrl.toString(),
      });
    } catch (error) {
      this.logger.error(
        'Unable to send password reset email to ' + user.email + '.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
