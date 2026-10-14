import { db } from '../db/client.js';
import { levels, type User } from '../db/schema.js';

/** Resolve legacy users.level_id values (integer text or labels like "Niveau 1") to the current levels table. */
export async function resolveUserLevelId(user: Pick<User, 'levelId'>): Promise<number | null> {
  const stored = user.levelId?.trim();
  if (!stored) return null;
  const available = await db.select({ id: levels.id, name: levels.name }).from(levels);
  const numeric = Number(stored);
  if (Number.isInteger(numeric) && available.some((level) => level.id === numeric)) return numeric;
  const normalize = (value: string) => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const exact = available.find((level) => normalize(level.name) === normalize(stored));
  if (exact) return exact.id;
  const digits = stored.match(/\d+/)?.[0];
  if (digits) {
    const matches = available.filter((level) => level.name.match(/\d+/)?.[0] === digits);
    if (matches.length === 1) return matches[0].id;
  }
  return null;
}
