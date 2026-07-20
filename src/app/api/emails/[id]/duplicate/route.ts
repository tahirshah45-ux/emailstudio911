import { NextRequest, NextResponse } from "next/server";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { EmailDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const source = await repo.get<EmailDocument>(COLLECTIONS.communications, params.id);
  if (!source) return NextResponse.json({ error: "Email not found." }, { status: 404 });

  const now = new Date().toISOString();
  const { id, createdAt, updatedAt, history, approvalStatus, sentAt, sentTo, ...fields } = source;
  const copyFields = { ...fields, subject: `${source.subject} (Copy)` };
  const copy: EmailDocument = {
    ...copyFields,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    history: [{ version: 1, savedAt: now, fields: copyFields }],
    // A duplicate is a fresh document: approval and send state do not carry over.
    approvalStatus: "none",
    sentAt: null,
    sentTo: null,
  };
  await repo.set(COLLECTIONS.communications, copy.id, copy);

  if (copy.projectId) {
    await addEvent(copy.projectId, "email_drafted", `Draft created (duplicate): "${copy.subject}".`, copy.id);
  }

  return NextResponse.json(copy, { status: 201 });
}
