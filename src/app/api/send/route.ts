import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, repo } from "@/lib/store";
import type { AppSettings, EmailDocument } from "@/lib/types";
import { SETTINGS_DOC_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Resend service — sends the generated email and records the send in the
 * project documentation trail (sentAt/sentTo on the communication,
 * plus timeline events).
 *
 * Transport credentials come from environment variables ONLY.
 * Sender identity (From name/email, Reply-To) is editable from the
 * application Settings page and stored in Firestore; env vars act as
 * fallback defaults.
 */

interface SendPayload {
  to: string;
  subject: string;
  html: string;
  /** Saved communication id — enables documentation logging. */
  emailId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveFrom(settings: AppSettings | null): string {
  if (settings?.senderName && settings?.senderEmail) {
    return `${settings.senderName} <${settings.senderEmail}>`;
  }
  const envFrom = process.env.EMAIL_FROM;
  if (!envFrom) {
    throw new Error(
      "Resend is not configured. Set EMAIL_FROM in your environment (e.g. \"911 Makers <project@911makers.com>\")."
    );
  }
  return envFrom;
}

export async function POST(req: NextRequest) {
  let payload: SendPayload;
  try {
    payload = (await req.json()) as SendPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { to, subject, html, emailId } = payload;
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "A valid recipient email address is required." }, { status: 400 });
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  }
  if (!html?.trim()) {
    return NextResponse.json({ error: "Email HTML is empty — generate the email first." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Resend is not configured. Set RESEND_API_KEY in your environment." },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(apiKey);

    // Sender identity: application settings first, env fallback.
    const settings = await repo
      .get<AppSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID)
      .catch(() => null);
    const from = resolveFrom(settings);
    const replyTo = settings?.replyToEmail || process.env.EMAIL_REPLY_TO || undefined;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: `Resend API error: ${error.message}`, code: error.name },
        { status: 502 }
      );
    }

    // Documentation trail: mark the communication as sent + log timeline events.
    if (emailId) {
      const doc = await repo.get<EmailDocument>(COLLECTIONS.communications, emailId);
      if (doc) {
        const now = new Date().toISOString();
        const requiresApproval =
          doc.approvalText.trim().length > 0 &&
          (doc.approvalStatus === "none" || doc.approvalStatus === "pending" || !doc.approvalStatus);
        const next: EmailDocument = {
          ...doc,
          sentAt: now,
          sentTo: to,
          approvalStatus: requiresApproval ? "requested" : doc.approvalStatus ?? "none",
          updatedAt: now,
        };
        await repo.set(COLLECTIONS.communications, next.id, next);

        if (doc.projectId) {
          await addEvent(doc.projectId, "email_sent", `Sent to ${to}: "${subject}".`, doc.id);
          if (requiresApproval) {
            await addEvent(
              doc.projectId,
              "approval_requested",
              `Approval requested: "${doc.subject || doc.documentTitle}".`,
              doc.id
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, messageId: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    console.error("Email send failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
