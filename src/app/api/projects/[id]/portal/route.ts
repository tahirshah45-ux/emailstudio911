import { NextRequest, NextResponse } from "next/server";
import { createPortal, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

/** Creates a secure client portal for one communication of this project. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { communicationId?: string; expiresInDays?: number };
    if (!body.communicationId) {
      return NextResponse.json({ error: "communicationId is required." }, { status: 400 });
    }
    const { portal, url } = await createPortal({
      projectId: params.id,
      communicationId: body.communicationId,
      expiresInDays: body.expiresInDays,
      origin: req.nextUrl.origin,
    });
    // The raw URL is returned exactly once — it cannot be recovered later.
    return NextResponse.json(
      { url, expiresAt: portal.expiresAt, status: portal.status },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PortalError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error("[portal:create]", err);
    return NextResponse.json({ error: "The portal could not be created." }, { status: 500 });
  }
}
