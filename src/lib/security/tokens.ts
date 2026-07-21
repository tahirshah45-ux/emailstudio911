import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Secure portal tokens.
 *
 * The raw token (256 bits, URL-safe) is returned exactly once when a
 * portal is created and embedded in the client's link. Only its SHA-256
 * hash is stored — as the portal document id — so a database read can
 * never reveal a usable link, and lookup is O(1) with no queries.
 */

export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Basic shape check before hashing — rejects junk early. */
export function looksLikeToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,50}$/.test(token);
}
