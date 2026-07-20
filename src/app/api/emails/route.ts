import { NextRequest, NextResponse } from "next/server";
import { addEvent } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument, EmailFields } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  const projectId = req.nextUrl.searchParams.get("projectId");
  let emails = await readCollection<EmailDocument>("emails");
  if (projectId) emails = emails.filter((e) => e.projectId === projectId);
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
      historyCount: history.length,
    }))
  );
}

export async function POST(req: NextRequest) {
  const fields = (await req.json()) as EmailFields;
  const now = new Date().toISOString();
  const doc: EmailDocument = {
    ...fields,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    history: [{ version: 1, savedAt: now, fields }],
    approvalStatus: "none",
    sentAt: null,
    sentTo: null,
  };
  const emails = await readCollection<EmailDocument>("emails");
  emails.push(doc);
  await writeCollection("emails", emails);

  if (doc.projectId) {
    await addEvent(doc.projectId, "email_drafted", `Draft created: "${doc.subject || doc.documentTitle}".`, doc.id);
  }

  return NextResponse.json(doc, { status: 201 });
}
