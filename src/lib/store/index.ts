import "server-only";
import type { Repository } from "./repository";
import { adminRepo } from "./adminRepo";
import { jsonRepo } from "./jsonRepo";

export { COLLECTIONS, newId } from "./repository";
export type { Repository } from "./repository";

/**
 * Server-side driver selection (this module is server-only — it is
 * imported exclusively by API routes and server code).
 *
 * Production default: Firestore via the ADMIN SDK — authenticated with a
 * service account, never blocked by Firestore Security Rules.
 *
 * STORAGE_DRIVER=json switches to local JSON files for offline
 * development and CI smoke tests only.
 *
 * Browser components never import this module; they either call the API
 * routes or (where appropriate) use the Firebase Web SDK via
 * src/lib/firebase.ts + src/lib/store/firestoreRepo.ts, which is subject
 * to Firestore Security Rules.
 */
const driver = (process.env.STORAGE_DRIVER ?? "firestore").toLowerCase();

export const repo: Repository = driver === "json" ? jsonRepo : adminRepo;
