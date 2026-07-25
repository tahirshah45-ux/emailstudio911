import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { COLLECTIONS, repo } from "@/lib/store";
import type { AppSettings } from "@/lib/types";
import { SETTINGS_DOC_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULTS: AppSettings = {
  id: SETTINGS_DOC_ID,
  senderName: "911 Makers",
  senderEmail: "",
  replyToEmail: "",
  updatedAt: "",
};

export const GET = withApiErrors("settings", async () => {
  const settings = await repo.get<AppSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID);
  return NextResponse.json(settings ?? DEFAULTS);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PUT = withApiErrors("settings", async (req: NextRequest) => {
  const body = (await req.json()) as Partial<AppSettings>;

  if (body.senderEmail && !EMAIL_RE.test(body.senderEmail)) {
    return NextResponse.json({ error: "Sender email is not a valid address." }, { status: 400 });
  }
  if (body.replyToEmail && !EMAIL_RE.test(body.replyToEmail)) {
    return NextResponse.json({ error: "Reply-To email is not a valid address." }, { status: 400 });
  }

  const prev = (await repo.get<AppSettings>(COLLECTIONS.settings, SETTINGS_DOC_ID)) ?? DEFAULTS;
  const next: AppSettings = {
    ...prev,
    senderName: body.senderName?.trim() ?? prev.senderName,
    senderEmail: body.senderEmail?.trim() ?? prev.senderEmail,
    replyToEmail: body.replyToEmail?.trim() ?? prev.replyToEmail,
    id: SETTINGS_DOC_ID,
    updatedAt: new Date().toISOString(),
  };
  await repo.set(COLLECTIONS.settings, SETTINGS_DOC_ID, next);
  return NextResponse.json(next);
});
