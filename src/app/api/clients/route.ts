import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withApiErrors("clients", async () => {
  const clients = await repo.list<Client>(COLLECTIONS.clients);
  return NextResponse.json(clients.sort((a, b) => a.name.localeCompare(b.name)));
});

export const POST = withApiErrors("clients", async (req: NextRequest) => {
  const body = (await req.json()) as Partial<Client>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const client: Client = {
    id: newId(),
    name: body.name.trim(),
    company: body.company?.trim() ?? "",
    email: body.email?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await repo.set(COLLECTIONS.clients, client.id, client);
  return NextResponse.json(client, { status: 201 });
});
