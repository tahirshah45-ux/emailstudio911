import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { apiErrorResponse, isQuotaExceededError } from "@/lib/apiErrors";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, repo } from "@/lib/store";
import type { AppSettings, EmailDocument } from "@/lib/types";
import { SETTINGS_DOC_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * SMTP service — sends the generated email and records the send in the
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

function resolveTransportOptions() {
  const provider = (process.env.SMTP_PROVIDER ?? "custom").toLowerCase();
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_USER and SMTP_PASS in your environment (.env.local)."
    );
  }

  const auth = { user, pass };

  switch (provider) {
    case "gmail":
      return { host: "smtp.gmail.com", port: 465, secure: true, auth };
    case "microsoft":
    case "outlook":
    case "office365":
      return { host: "smtp.office365.com", port: 587, secure: false, auth };
    case "custom": {
      const host = process.env.SMTP_HOST;
      if (!host) throw new Error("SMTP_PROVIDER=custom requires SMTP_HOST to be set.");
      return {
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth,
      };
    }
    default:
      throw new Error(`Unknown SMTP_PROVIDER "${provider}". Use gmail, microsoft, or custom.`);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  try {
    const transporter = nodemailer.createTransport(resolveTransportOptions());

    // Sender identity: application settings first, env fallback.
    const settings = await repo
      .get<AppSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID)
      .catch(() => null);
    const fromName = settings?.senderName || process.env.SMTP_FROM_NAME || "911 Makers";
    const fromEmail = settings?.senderEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
    const replyTo = settings?.replyToEmail || process.env.SMTP_REPLY_TO || undefined;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

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

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) return apiErrorResponse(err, "send");
    console.error("[api:send]", err);
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
