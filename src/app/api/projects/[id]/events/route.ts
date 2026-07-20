import { NextRequest, NextResponse } from "next/server";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, repo } from "@/lib/store";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Adds a manual note to the project timeline (e.g. "Client confirmed by phone"). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { description?: string };
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }
  const project = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const event = await addEvent(params.id, "note", body.description.trim());
  return NextResponse.json(event, { status: 201 });
}
