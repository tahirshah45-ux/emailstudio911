import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase initialization — single app instance, named Firestore database.
 * Config is read from environment variables with the official
 * client-communication-center project as the default (the web config is
 * not a secret; security is enforced by Firestore rules).
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyB0IQcEbXbRpJzphFmbz8PfHpBI7wLZbNA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "client-communication-center.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "client-communication-center",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "client-communication-center.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1005001437170",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:1005001437170:web:143606159241c541fb856b",
};

export const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ?? "emailsystem911makers";

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (db) return db;
  const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
  db = getFirestore(app, FIRESTORE_DATABASE_ID);
  return db;
}
