import { durationToMilliseconds, normalizeEmail, slugify } from './auth.utils';

describe('auth utilities', () => {
  it('normalizes an e-mail before it is used as an identifier', () => {
    expect(normalizeEmail('  Mamy.Rakoto@Example.MG ')).toBe('mamy.rakoto@example.mg');
  });

  it('creates a stable, URL-safe organization slug', () => {
    expect(slugify("  L'Atelier Créatif  ")).toBe('l-atelier-creatif');
  });

  it.each([
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['30d', 2_592_000_000],
  ])('converts %s to milliseconds', (duration, expected) => {
    expect(durationToMilliseconds(duration)).toBe(expected);
  });

  it('rejects unsupported JWT durations', () => {
    expect(() => durationToMilliseconds('15 minutes')).toThrow('Durée JWT invalide');
  });
});
