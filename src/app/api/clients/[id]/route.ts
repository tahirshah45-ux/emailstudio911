import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { COLLECTIONS, repo } from "@/lib/store";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export const PUT = withApiErrors("clients", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = (await req.json()) as Partial<Client>;
  const client = await repo.get<Client>(COLLECTIONS.clients, params.id);
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const next: Client = {
    ...client,
    name: body.name?.trim() ?? client.name,
    company: body.company?.trim() ?? client.company,
    email: body.email?.trim() ?? client.email,
    updatedAt: new Date().toISOString(),
  };
  await repo.set(COLLECTIONS.clients, next.id, next);
  return NextResponse.json(next);
});

export const DELETE = withApiErrors("clients", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const client = await repo.get<Client>(COLLECTIONS.clients, params.id);
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  await repo.remove(COLLECTIONS.clients, params.id);
  return NextResponse.json({ ok: true });
});
