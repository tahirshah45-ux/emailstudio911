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
  /**
   * Server-side equality-filtered list — e.g. all communications for one
   * project. Prefer this over `list()` + `.filter()` whenever a collection
   * can hold documents for many projects/portals: filtering in Firestore
   * means only the matching documents are ever read.
   */
  listWhere<T extends Identifiable>(collection: string, field: string, value: string): Promise<T[]>;
  /**
   * Server-side count of documents matching an equality filter. Backed by
   * a Firestore aggregation query where possible, so counting (e.g. a
   * project's communications) never requires reading the documents' data.
   */
  count(collection: string, field: string, value: string): Promise<number>;
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
