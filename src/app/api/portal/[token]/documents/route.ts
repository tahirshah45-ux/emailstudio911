import { NextRequest, NextResponse } from "next/server";
import { registerDocument, PortalError } from "@/lib/services/portalService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = (await req.json()) as {
      category?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      publicId?: string;
      resourceType?: string;
      secureUrl?: string;
    };
    if (
      !body.category ||
      !body.originalName ||
      !body.mimeType ||
      typeof body.size !== "number" ||
      !body.publicId ||
      !body.resourceType ||
      !body.secureUrl
    ) {
      return NextResponse.json({ error: "Incomplete upload information.", code: "validation" }, { status: 400 });
    }
    const doc = await registerDocument(params.token, {
      category: body.category,
      originalName: body.originalName,
      mimeType: body.mimeType,
      size: body.size,
      publicId: body.publicId,
      resourceType: body.resourceType,
      secureUrl: body.secureUrl,
    });
    return NextResponse.json(
      {
        id: doc.id,
        category: doc.category,
        originalName: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        thumbnailUrl: doc.thumbnailUrl,
        secureUrl: doc.secureUrl,
        uploadedAt: doc.uploadedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PortalError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
    }
    console.error("[portal:register]", err);
    return NextResponse.json(
      { error: "The file could not be saved. Please try again.", code: "internal" },
      { status: 500 }
    );
  }
}
