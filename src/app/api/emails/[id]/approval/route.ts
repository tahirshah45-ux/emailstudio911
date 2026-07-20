import { NextRequest, NextResponse } from "next/server";
import { approvalEventType, APPROVAL_LABELS } from "@/lib/domain/stages";
import { addEvent } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { ApprovalStatus, EmailDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: ApprovalStatus[] = ["none", "pending", "requested", "approved", "rejected", "needs_revision"];

/**
 * Records a client approval decision for a communication.
 * The decision is written to the document AND to the immutable
 * project timeline, making it part of the official record.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { status?: ApprovalStatus; note?: string };
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID.join(", ")}` }, { status: 400 });
  }

  const emails = await readCollection<EmailDocument>("emails");
  const idx = emails.findIndex((e) => e.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Communication not found." }, { status: 404 });

  emails[idx] = { ...emails[idx], approvalStatus: body.status, updatedAt: new Date().toISOString() };
  await writeCollection("emails", emails);

  const doc = emails[idx];
  const eventType = approvalEventType(body.status);
  if (doc.projectId && eventType) {
    const note = body.note?.trim() ? ` — ${body.note.trim()}` : "";
    await addEvent(
      doc.projectId,
      eventType,
      `${APPROVAL_LABELS[body.status]}: "${doc.subject || doc.documentTitle}"${note}`,
      doc.id
    );
  }

  return NextResponse.json(doc);
}
