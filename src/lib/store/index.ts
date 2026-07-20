import type { Repository } from "./repository";
import { firestoreRepo } from "./firestoreRepo";
import { jsonRepo } from "./jsonRepo";

export { COLLECTIONS, newId } from "./repository";
export type { Repository } from "./repository";

/**
 * Driver selection.
 * Production default: Firestore (the only source of truth).
 * STORAGE_DRIVER=json switches to local JSON files for offline
 * development and CI smoke tests only.
 */
const driver = (process.env.STORAGE_DRIVER ?? "firestore").toLowerCase();

export const repo: Repository = driver === "json" ? jsonRepo : firestoreRepo;
