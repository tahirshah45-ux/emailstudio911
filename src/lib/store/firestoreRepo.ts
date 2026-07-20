import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Identifiable, Repository } from "./repository";

/**
 * Firestore repository driver — Firebase WEB SDK, browser context.
 *
 * NOT used by API routes (they use adminRepo, which authenticates with a
 * service account and bypasses Security Rules). This driver exists for
 * browser components that may talk to Firestore directly in the future;
 * it is subject to Firestore Security Rules (see firestore.rules).
 */

/** Firestore rejects `undefined` values — strip them deeply. */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const firestoreRepo: Repository = {
  async list<T extends Identifiable>(name: string): Promise<T[]> {
    const snap = await getDocs(collection(getDb(), name));
    return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
  },

  async get<T extends Identifiable>(name: string, id: string): Promise<T | null> {
    const snap = await getDoc(doc(getDb(), name, id));
    if (!snap.exists()) return null;
    return { ...(snap.data() as T), id: snap.id };
  },

  async set<T extends Identifiable>(name: string, id: string, document: T): Promise<void> {
    await setDoc(doc(getDb(), name, id), sanitize({ ...document, id }));
  },

  async remove(name: string, id: string): Promise<void> {
    await deleteDoc(doc(getDb(), name, id));
  },
};
