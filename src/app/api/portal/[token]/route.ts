import { NextRequest, NextResponse } from "next/server";
import { getSession, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

function portalErrorResponse(err: unknown): NextResponse {
  if (err instanceof PortalError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
  }
  console.error("[portal]", err);
  return NextResponse.json(
    { error: "Something went wrong on our side. Please try again shortly.", code: "internal" },
    { status: 500 }
  );
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    return NextResponse.json(await getSession(params.token));
  } catch (err) {
    return portalErrorResponse(err);
  }
}
