import { generateResetToken, hashResetToken } from './reset-token.utils';

describe('password reset token helpers', () => {
  it('generates a 256-bit opaque token', () => {
    expect(generateResetToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns a deterministic digest rather than the raw token', () => {
    const token = 'a'.repeat(64);

    expect(hashResetToken(token)).toHaveLength(64);
    expect(hashResetToken(token)).toBe(hashResetToken(token));
    expect(hashResetToken(token)).not.toBe(token);
  });
});
