import { readCollection, writeCollection } from "./jsonStore";
import type { Identifiable, Repository } from "./repository";

/**
 * JSON-file repository driver — development/offline fallback.
 * Not used in production (Firestore is the source of truth); kept so the
 * app can run without network access and for CI smoke tests
 * (STORAGE_DRIVER=json).
 */
export const jsonRepo: Repository = {
  async list<T extends Identifiable>(collection: string): Promise<T[]> {
    return readCollection<T>(collection);
  },

  async query<T extends Identifiable>(collection: string, field: string, value: string): Promise<T[]> {
    const items = await readCollection<T>(collection);
    return items.filter((i) => (i as unknown as Record<string, unknown>)[field] === value);
  },

  async get<T extends Identifiable>(collection: string, id: string): Promise<T | null> {
    const items = await readCollection<T>(collection);
    return items.find((i) => i.id === id) ?? null;
  },

  async set<T extends Identifiable>(collection: string, id: string, doc: T): Promise<void> {
    const items = await readCollection<T>(collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) items.push({ ...doc, id });
    else items[idx] = { ...doc, id };
    await writeCollection(collection, items);
  },

  async remove(collection: string, id: string): Promise<void> {
    const items = await readCollection<Identifiable>(collection);
    await writeCollection(
      collection,
      items.filter((i) => i.id !== id)
    );
  },
};
