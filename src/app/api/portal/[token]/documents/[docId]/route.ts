import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/apiErrors";
import { removeDocument, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string; docId: string } }
) {
  try {
    await removeDocument(params.token, params.docId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PortalError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
    }
    return apiErrorResponse(err, "portal:remove");
  }
}
