import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await readCollection<Client>("clients");
  return NextResponse.json(clients.sort((a, b) => a.name.localeCompare(b.name)));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Client>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const client: Client = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    name: body.name.trim(),
    company: body.company?.trim() ?? "",
    email: body.email?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const clients = await readCollection<Client>("clients");
  clients.push(client);
  await writeCollection("clients", clients);
  return NextResponse.json(client, { status: 201 });
}
