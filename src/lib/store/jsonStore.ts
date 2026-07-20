import { promises as fs } from "fs";
import path from "path";

/**
 * Minimal JSON-file persistence layer (server-side only).
 *
 * Chosen per project decision: data lives in plain JSON files under DATA_DIR
 * (default ./data). Works locally and on any persistent host (VPS/Docker).
 *
 * NOTE for Vercel: serverless filesystems are ephemeral — writes survive only
 * for the lifetime of a single instance. The repository interface below is the
 * only thing that touches disk; to move to Vercel Postgres/KV later, replace
 * this one module.
 */

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readCollection<T>(name: string): Promise<T[]> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, file);
}
