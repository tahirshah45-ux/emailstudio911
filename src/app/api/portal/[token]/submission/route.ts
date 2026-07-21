import { NextRequest, NextResponse } from "next/server";
import { saveDraft, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

function errorResponse(err: unknown): NextResponse {
  if (err instanceof PortalError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
  }
  console.error("[portal:submission]", err);
  return NextResponse.json(
    { error: "Your changes could not be saved. Please try again.", code: "internal" },
    { status: 500 }
  );
}

export async function PUT(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await req.json();
    const { completedSection, ...patch } = body ?? {};
    const result = await saveDraft(params.token, patch, completedSection);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
