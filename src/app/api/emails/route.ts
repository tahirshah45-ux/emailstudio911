import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { EmailDocument, EmailFields } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withApiErrors("emails", async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  const projectId = req.nextUrl.searchParams.get("projectId");
  // Scoped to a project: query only that project's documents. Unscoped
  // full-text search still needs every document, since Firestore has no
  // text-search index to filter on server-side.
  let emails = projectId
    ? await repo.query<EmailDocument>(COLLECTIONS.communications, "projectId", projectId)
    : await repo.list<EmailDocument>(COLLECTIONS.communications);
  if (q) {
    emails = emails.filter((e) =>
      [e.subject, e.documentTitle, e.clientName, e.company, e.projectName, e.referenceNumber, e.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  emails.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // List view: omit heavy fields; normalize records created before the
  // project/approval fields existed.
  return NextResponse.json(
    emails.map(({ contentHtml, history, ...rest }) => ({
      ...rest,
      projectId: rest.projectId ?? null,
      approvalStatus: rest.approvalStatus ?? "none",
      sentAt: rest.sentAt ?? null,
      sentTo: rest.sentTo ?? null,
      historyCount: history?.length ?? 0,
    }))
  );
});

export const POST = withApiErrors("emails", async (req: NextRequest) => {
  const fields = (await req.json()) as EmailFields;
  const now = new Date().toISOString();
  const doc: EmailDocument = {
    ...fields,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    history: [{ version: 1, savedAt: now, fields }],
    approvalStatus: "none",
    sentAt: null,
    sentTo: null,
  };
  await repo.set(COLLECTIONS.communications, doc.id, doc);

  if (doc.projectId) {
    await addEvent(doc.projectId, "email_drafted", `Draft created: "${doc.subject || doc.documentTitle}".`, doc.id);
  }

  return NextResponse.json(doc, { status: 201 });
});
