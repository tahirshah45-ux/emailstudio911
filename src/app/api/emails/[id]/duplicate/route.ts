import { NextRequest, NextResponse } from "next/server";
import { addEvent } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const emails = await readCollection<EmailDocument>("emails");
  const source = emails.find((e) => e.id === params.id);
  if (!source) return NextResponse.json({ error: "Email not found." }, { status: 404 });

  const now = new Date().toISOString();
  const { id, createdAt, updatedAt, history, approvalStatus, sentAt, sentTo, ...fields } = source;
  const copyFields = { ...fields, subject: `${source.subject} (Copy)` };
  const copy: EmailDocument = {
    ...copyFields,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    history: [{ version: 1, savedAt: now, fields: copyFields }],
    // A duplicate is a fresh document: approval and send state do not carry over.
    approvalStatus: "none",
    sentAt: null,
    sentTo: null,
  };
  emails.push(copy);
  await writeCollection("emails", emails);

  if (copy.projectId) {
    await addEvent(copy.projectId, "email_drafted", `Draft created (duplicate): "${copy.subject}".`, copy.id);
  }

  return NextResponse.json(copy, { status: 201 });
}
