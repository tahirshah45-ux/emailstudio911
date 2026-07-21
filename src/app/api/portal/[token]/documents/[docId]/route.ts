import { NextRequest, NextResponse } from "next/server";
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
    console.error("[portal:remove]", err);
    return NextResponse.json(
      { error: "The file could not be removed. Please try again.", code: "internal" },
      { status: 500 }
    );
  }
}
