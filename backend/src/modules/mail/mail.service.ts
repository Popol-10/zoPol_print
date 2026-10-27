import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EnvironmentVariables } from '../../config/environment.validation';

export interface PasswordResetEmail {
  recipient: string;
  resetUrl: string;
}

export interface QuoteEmail {
  recipient: string;
  organizationName: string;
  currency: string;
  quoteNumber: string;
  clientName: string;
  clientCompany: string | null;
  productName: string;
  productReference: string;
  machine: string;
  quantity: number;
  unitPrice: number;
  total: number;
  validUntil: string;
  note: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
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

  async sendQuote(quote: QuoteEmail): Promise<void> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'L’envoi de courriels n’est pas configuré sur le serveur.',
      );
    }

    const organizationName = escapeHtml(quote.organizationName);
    const clientName = escapeHtml(quote.clientName);
    const clientCompany = quote.clientCompany
      ? escapeHtml(quote.clientCompany)
      : null;
    const productName = escapeHtml(quote.productName);
    const productReference = escapeHtml(quote.productReference);
    const machine = escapeHtml(quote.machine);
    const quoteNumber = escapeHtml(quote.quoteNumber);
    const unitPrice = escapeHtml(formatAmount(quote.unitPrice, quote.currency));
    const total = escapeHtml(formatAmount(quote.total, quote.currency));
    const validUntil = escapeHtml(quote.validUntil);
    const note = quote.note
      ? escapeHtml(quote.note).replace(/\r?\n/g, '<br>')
      : null;
    const text = [
      `Bonjour ${quote.clientName},`,
      '',
      `${quote.organizationName} vous adresse le devis ${quote.quoteNumber}.`,
      '',
      `Produit : ${quote.productName} (${quote.productReference})`,
      `Machine : ${quote.machine}`,
      `Quantité : ${quote.quantity}`,
      `Prix unitaire : ${formatAmount(quote.unitPrice, quote.currency)}`,
      `Total : ${formatAmount(quote.total, quote.currency)}`,
      `Valable jusqu’au : ${quote.validUntil}`,
      ...(quote.note ? ['', `Note : ${quote.note}`] : []),
      '',
      'Pour toute question, répondez à cet e-mail.',
    ].join('\n');

    try {
      const result = await this.getTransporter().sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to: quote.recipient,
        subject: `Devis ${quote.quoteNumber}`,
        text,
        html: `
          <div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:640px;margin:0 auto">
            <p>Bonjour ${clientName},</p>
            <p>${organizationName} vous adresse le devis <strong>${quoteNumber}</strong>${clientCompany ? ` pour ${clientCompany}` : ''}.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0">
              <tbody>
                <tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Produit</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${productName} (${productReference})</td></tr>
                <tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Machine</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${machine}</td></tr>
                <tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Quantité</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${quote.quantity}</td></tr>
                <tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Prix unitaire</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">${unitPrice}</td></tr>
                <tr><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Total</th><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${total}</strong></td></tr>
                <tr><th align="left" style="padding:8px">Valable jusqu’au</th><td style="padding:8px">${validUntil}</td></tr>
              </tbody>
            </table>
            ${note ? `<p><strong>Note :</strong><br>${note}</p>` : ''}
            <p>Pour toute question, répondez à cet e-mail.</p>
          </div>
        `,
      });
      const acceptedRecipients: unknown = result.accepted;
      const expectedRecipient = quote.recipient.trim().toLowerCase();
      const accepted =
        Array.isArray(acceptedRecipients) &&
        acceptedRecipients.some((entry: unknown) => {
          const address =
            typeof entry === 'string'
              ? entry
              : typeof entry === 'object' &&
                  entry !== null &&
                  'address' in entry &&
                  typeof entry.address === 'string'
                ? entry.address
                : '';
          return address.toLowerCase() === expectedRecipient;
        });
      if (!accepted) {
        throw new ServiceUnavailableException(
          'Le serveur de messagerie n’a pas accepté l’adresse du client.',
        );
      }
      this.logger.log(`Devis ${quote.quoteNumber} envoyé par e-mail.`);
    } catch (error) {
      this.logger.error(
        `Échec de l’envoi du devis ${quote.quoteNumber}.`,
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Le courriel du devis n’a pas pu être envoyé. Le devis reste en brouillon.',
      );
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    return this.transporter;
  }
}
