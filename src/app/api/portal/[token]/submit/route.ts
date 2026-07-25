import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/apiErrors";
import { submit, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = (await req.json()) as {
      scopeConfirmed?: boolean;
      checklistConfirmations?: string[];
      declarationAccepted?: boolean;
      signatureDataUrl?: string;
    };
    const result = await submit(params.token, {
      scopeConfirmed: Boolean(body.scopeConfirmed),
      checklistConfirmations: Array.isArray(body.checklistConfirmations) ? body.checklistConfirmations : [],
      declarationAccepted: Boolean(body.declarationAccepted),
      signatureDataUrl: body.signatureDataUrl ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PortalError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
    }
    return apiErrorResponse(err, "portal:submit");
  }
}
