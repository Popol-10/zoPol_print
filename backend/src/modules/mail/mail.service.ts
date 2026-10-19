import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EnvironmentVariables } from '../../config/environment.validation';

export interface PasswordResetEmail {
  recipient: string;
  resetUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  isEnabled(): boolean {
    return this.config.getOrThrow<boolean>('SMTP_ENABLED');
  }

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    if (!this.isEnabled()) return;

    await this.getTransporter().sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: email.recipient,
      subject: "Réinitialisation de votre mot de passe MAK'ART",
      text: [
        'Une demande de réinitialisation de mot de passe a été reçue.',
        '',
        'Utilisez ce lien pour choisir un nouveau mot de passe :',
        email.resetUrl,
        '',
        'Ce lien expire automatiquement. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.',
      ].join('\n'),
      html: `
        <p>Une demande de réinitialisation de mot de passe a été reçue.</p>
        <p><a href="${email.resetUrl}">Choisir un nouveau mot de passe</a></p>
        <p>Ce lien expire automatiquement. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
      `,
    });

    this.logger.log(`E-mail de réinitialisation envoyé à ${email.recipient}.`);
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    return this.transporter;
  }
}
