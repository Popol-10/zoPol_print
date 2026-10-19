import { createHash, randomBytes } from 'crypto';

/** Generates the opaque one-time token sent to the user. */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/** Only this SHA-256 digest is persisted in MySQL. */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
