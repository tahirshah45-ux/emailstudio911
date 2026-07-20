import "server-only";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Identifiable, Repository } from "./repository";

/**
 * Firestore repository driver — ADMIN SDK, server only.
 * This is the production driver for all API routes. It authenticates with
 * a service account, so Firestore Security Rules never block it.
 */

/** Firestore rejects `undefined` values — strip them deeply. */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const adminRepo: Repository = {
  async list<T extends Identifiable>(name: string): Promise<T[]> {
    const snap = await getAdminDb().collection(name).get();
    return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
  },

  async get<T extends Identifiable>(name: string, id: string): Promise<T | null> {
    const snap = await getAdminDb().collection(name).doc(id).get();
    if (!snap.exists) return null;
    return { ...(snap.data() as T), id: snap.id };
  },

  async set<T extends Identifiable>(name: string, id: string, document: T): Promise<void> {
    await getAdminDb()
      .collection(name)
      .doc(id)
      .set(sanitize({ ...document, id }));
  },

  async remove(name: string, id: string): Promise<void> {
    await getAdminDb().collection(name).doc(id).delete();
  },
};
