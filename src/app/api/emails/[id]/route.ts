import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { COLLECTIONS, repo } from "@/lib/store";
import type { EmailDocument, EmailFields } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Version history cap. Kept conservative because Firestore documents are
 * limited to 1 MB and each snapshot includes the full rich-text content.
 */
const MAX_HISTORY = 10;

export const GET = withApiErrors("emails", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const doc = await repo.get<EmailDocument>(COLLECTIONS.communications, params.id);
  if (!doc) return NextResponse.json({ error: "Email not found." }, { status: 404 });
  // Normalize records created before the project/approval fields existed.
  return NextResponse.json({
    ...doc,
    projectId: doc.projectId ?? null,
    approvalStatus: doc.approvalStatus ?? "none",
    sentAt: doc.sentAt ?? null,
    sentTo: doc.sentTo ?? null,
    history: doc.history ?? [],
  });
});

export const PUT = withApiErrors("emails", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const fields = (await req.json()) as EmailFields;
  const prev = await repo.get<EmailDocument>(COLLECTIONS.communications, params.id);
  if (!prev) return NextResponse.json({ error: "Email not found." }, { status: 404 });

  const now = new Date().toISOString();
  const prevHistory = prev.history ?? [];
  const nextVersion = (prevHistory[prevHistory.length - 1]?.version ?? 0) + 1;
  const history = [...prevHistory, { version: nextVersion, savedAt: now, fields }].slice(-MAX_HISTORY);

  const next: EmailDocument = { ...prev, ...fields, id: prev.id, updatedAt: now, history };
  await repo.set(COLLECTIONS.communications, next.id, next);
  return NextResponse.json(next);
});

export const DELETE = withApiErrors("emails", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const doc = await repo.get<EmailDocument>(COLLECTIONS.communications, params.id);
  if (!doc) return NextResponse.json({ error: "Email not found." }, { status: 404 });
  await repo.remove(COLLECTIONS.communications, params.id);
  return NextResponse.json({ ok: true });
});
