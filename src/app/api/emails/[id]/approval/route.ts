import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { approvalEventType, APPROVAL_LABELS } from "@/lib/domain/stages";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { ApprovalRecord, ApprovalStatus, AppSettings, EmailDocument } from "@/lib/types";
import { SETTINGS_DOC_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: ApprovalStatus[] = ["none", "pending", "requested", "approved", "rejected", "needs_revision"];

/**
 * Records a client approval decision for a communication.
 * The decision is written to:
 *   1. the communication document (current status),
 *   2. the `approvals` collection (immutable audit record: who/when/what/why),
 *   3. the project timeline (official record).
 */
export const POST = withApiErrors("emails:approval", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = (await req.json()) as { status?: ApprovalStatus; note?: string; user?: string };
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID.join(", ")}` }, { status: 400 });
  }

  const doc = await repo.get<EmailDocument>(COLLECTIONS.communications, params.id);
  if (!doc) return NextResponse.json({ error: "Communication not found." }, { status: 404 });

  const now = new Date().toISOString();
  const next: EmailDocument = { ...doc, approvalStatus: body.status, updatedAt: now };
  await repo.set(COLLECTIONS.communications, next.id, next);

  // Audit record — attributed to the configured sender identity unless specified.
  const settings = await repo.get<AppSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID);
  const record: ApprovalRecord = {
    id: newId(),
    communicationId: doc.id,
    projectId: doc.projectId ?? null,
    status: body.status,
    note: body.note?.trim() ?? "",
    user: body.user?.trim() || settings?.senderName || "Admin",
    at: now,
  };
  await repo.set(COLLECTIONS.approvals, record.id, record);

  const eventType = approvalEventType(body.status);
  if (doc.projectId && eventType) {
    const note = record.note ? ` — ${record.note}` : "";
    await addEvent(
      doc.projectId,
      eventType,
      `${APPROVAL_LABELS[body.status]}: "${doc.subject || doc.documentTitle}" (by ${record.user})${note}`,
      doc.id
    );
  }

  return NextResponse.json(next);
});
