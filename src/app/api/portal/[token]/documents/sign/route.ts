import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/apiErrors";
import { signDocumentUpload, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = (await req.json()) as {
      filename?: string;
      mimeType?: string;
      size?: number;
      category?: string;
    };
    if (!body.filename || !body.mimeType || typeof body.size !== "number" || !body.category) {
      return NextResponse.json({ error: "Incomplete file information.", code: "validation" }, { status: 400 });
    }
    const signed = await signDocumentUpload(params.token, {
      filename: body.filename,
      mimeType: body.mimeType,
      size: body.size,
      category: body.category,
    });
    return NextResponse.json(signed);
  } catch (err) {
    if (err instanceof PortalError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
    }
    return apiErrorResponse(err, "portal:sign");
  }
}
