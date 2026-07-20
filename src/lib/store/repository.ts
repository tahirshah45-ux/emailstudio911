/**
 * Storage abstraction — the ONLY contract business logic depends on.
 * Production driver: Firestore. Fallback driver: JSON files.
 * Adding another backend (Postgres, KV, …) means implementing this
 * interface; no business logic or API route changes required.
 */

export interface Identifiable {
  id: string;
}

export interface Repository {
  list<T extends Identifiable>(collection: string): Promise<T[]>;
  get<T extends Identifiable>(collection: string, id: string): Promise<T | null>;
  /** Creates or fully replaces a document. */
  set<T extends Identifiable>(collection: string, id: string, doc: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}

/** Canonical Firestore collection names. */
export const COLLECTIONS = {
  clients: "clients",
  projects: "projects",
  communications: "communications",
  events: "timeline_events",
  approvals: "approvals",
  checklists: "checklists",
  settings: "settings",
} as const;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
