import "server-only";
import { NextResponse } from "next/server";

/**
 * Central mapping from "something threw inside a route handler" to an HTTP
 * response — used so unexpected errors (most importantly Firestore's
 * RESOURCE_EXHAUSTED once the free-tier daily read quota is used up) never
 * leak their raw message to the browser. The full error is always logged
 * server-side for developers; the client only ever sees a short, generic,
 * professional message.
 */

const QUOTA_EXCEEDED_MESSAGE =
  "Project data is temporarily unavailable because the database usage limit has been reached. Please try again later.";

const GENERIC_MESSAGE = "Something went wrong on our side. Please try again shortly.";

/** Matches the Admin SDK, Web SDK, and gRPC shapes for RESOURCE_EXHAUSTED. */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string | number; message?: string };
  if (e.code === 8 || e.code === "resource-exhausted") return true;
  const message = String(e.message ?? "");
  return message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded");
}

/**
 * Converts an unexpected error thrown inside an API route handler into a
 * safe JSON response. Call this from a top-level `catch` — it does not
 * replace route-specific error handling (e.g. `PortalError`), which should
 * be checked first by the caller.
 */
export function apiErrorResponse(err: unknown, logTag: string): NextResponse {
  console.error(`[api${logTag ? `:${logTag}` : ""}]`, err);
  if (isQuotaExceededError(err)) {
    return NextResponse.json({ error: QUOTA_EXCEEDED_MESSAGE, code: "quota_exceeded" }, { status: 503 });
  }
  return NextResponse.json({ error: GENERIC_MESSAGE, code: "internal" }, { status: 500 });
}

/**
 * Wraps a Route Handler (GET/POST/PUT/DELETE) so any error it throws —
 * most importantly a Firestore RESOURCE_EXHAUSTED once the free-tier daily
 * read quota is used up — is caught and turned into a safe response instead
 * of an uncaught exception. Routes with their own domain-specific error
 * type (e.g. `PortalError`) should keep handling that themselves and only
 * rely on this for the unexpected fallback case.
 */
export function withApiErrors<Args extends unknown[]>(
  logTag: string,
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      return apiErrorResponse(err, logTag);
    }
  };
}
