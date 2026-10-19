export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'organization';
}

export function durationToMilliseconds(duration: string): number {
  const matches = /^(\d+)([smhd])$/.exec(duration);
  if (!matches) throw new Error(`Durée JWT invalide : ${duration}`);

  const amount = Number(matches[1]);
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const multiplier = multipliers[matches[2]];

  if (multiplier === undefined) {
    throw new Error('Unité de durée JWT invalide');
  }
  return amount * multiplier;
}
