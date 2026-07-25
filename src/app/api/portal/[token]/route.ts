import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/apiErrors";
import { getSession, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

function portalErrorResponse(err: unknown): NextResponse {
  if (err instanceof PortalError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
  }
  return apiErrorResponse(err, "portal");
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    return NextResponse.json(await getSession(params.token));
  } catch (err) {
    return portalErrorResponse(err);
  }
}
