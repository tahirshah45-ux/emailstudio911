import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Client>;
  const clients = await readCollection<Client>("clients");
  const idx = clients.findIndex((c) => c.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  clients[idx] = {
    ...clients[idx],
    name: body.name?.trim() ?? clients[idx].name,
    company: body.company?.trim() ?? clients[idx].company,
    email: body.email?.trim() ?? clients[idx].email,
    updatedAt: new Date().toISOString(),
  };
  await writeCollection("clients", clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const clients = await readCollection<Client>("clients");
  const next = clients.filter((c) => c.id !== params.id);
  if (next.length === clients.length) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
  await writeCollection("clients", next);
  return NextResponse.json({ ok: true });
}
