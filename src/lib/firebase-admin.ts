import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { FIRESTORE_DATABASE_ID } from "./firebase";

/**
 * Firebase ADMIN SDK initialization — SERVER ONLY.
 *
 * API routes must use the Admin SDK: it authenticates with a service
 * account and bypasses Firestore Security Rules, so server operations
 * never hit "Missing or insufficient permissions". The Web SDK
 * (src/lib/firebase.ts) remains for browser components only.
 *
 * Credentials (in order of precedence):
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY — the service-account JSON, either
 *      raw (one line) or base64-encoded. Recommended for local + Vercel.
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to the JSON file
 *      (standard Google application-default credentials).
 *
 * See FIRESTORE_SETUP.md for step-by-step instructions.
 */

let db: Firestore | null = null;

function credentialFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (raw) {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    try {
      return cert(JSON.parse(json));
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is set but could not be parsed. " +
          "Provide the service-account JSON either as a single line or base64-encoded. " +
          "See FIRESTORE_SETUP.md."
      );
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }
  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local " +
      "(service-account JSON, raw or base64) or GOOGLE_APPLICATION_CREDENTIALS. " +
      "Generate a key in Firebase Console → Project settings → Service accounts. " +
      "See FIRESTORE_SETUP.md."
  );
}

export function getAdminDb(): Firestore {
  if (db) return db;
  const existing = getApps().find((a) => a.name === "admin");
  const app: App = existing ?? initializeApp({ credential: credentialFromEnv() }, "admin");
  db = getFirestore(app, FIRESTORE_DATABASE_ID);
  return db;
}
