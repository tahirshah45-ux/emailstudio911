import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument, EmailFields } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 25;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const emails = await readCollection<EmailDocument>("emails");
  const doc = emails.find((e) => e.id === params.id);
  if (!doc) return NextResponse.json({ error: "Email not found." }, { status: 404 });
  // Normalize records created before the project/approval fields existed.
  return NextResponse.json({
    ...doc,
    projectId: doc.projectId ?? null,
    approvalStatus: doc.approvalStatus ?? "none",
    sentAt: doc.sentAt ?? null,
    sentTo: doc.sentTo ?? null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const fields = (await req.json()) as EmailFields;
  const emails = await readCollection<EmailDocument>("emails");
  const idx = emails.findIndex((e) => e.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Email not found." }, { status: 404 });

  const now = new Date().toISOString();
  const prev = emails[idx];
  const nextVersion = (prev.history[prev.history.length - 1]?.version ?? 0) + 1;
  const history = [...prev.history, { version: nextVersion, savedAt: now, fields }].slice(-MAX_HISTORY);

  emails[idx] = { ...prev, ...fields, updatedAt: now, history };
  await writeCollection("emails", emails);
  return NextResponse.json(emails[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const emails = await readCollection<EmailDocument>("emails");
  const next = emails.filter((e) => e.id !== params.id);
  if (next.length === emails.length) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }
  await writeCollection("emails", next);
  return NextResponse.json({ ok: true });
}
