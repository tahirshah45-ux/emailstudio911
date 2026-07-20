import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { addEvent } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Sends the generated email via SMTP and records the send in the
 * project documentation trail (sentAt/sentTo on the communication,
 * plus timeline events). Provider presets: gmail | microsoft | custom.
 * All credentials come from environment variables — never from the client.
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
    const fromName = process.env.SMTP_FROM_NAME ?? "911 Makers";
    const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER!;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    // Documentation trail: mark the communication as sent + log timeline events.
    if (emailId) {
      const emails = await readCollection<EmailDocument>("emails");
      const idx = emails.findIndex((e) => e.id === emailId);
      if (idx !== -1) {
        const now = new Date().toISOString();
        const doc = emails[idx];
        const requiresApproval =
          doc.approvalText.trim().length > 0 &&
          (doc.approvalStatus === "none" || doc.approvalStatus === "pending");
        emails[idx] = {
          ...doc,
          sentAt: now,
          sentTo: to,
          approvalStatus: requiresApproval ? "requested" : doc.approvalStatus,
          updatedAt: now,
        };
        await writeCollection("emails", emails);

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
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
