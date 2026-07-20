import { NextRequest, NextResponse } from "next/server";
import { addEvent } from "@/lib/store/events";
import { readCollection } from "@/lib/store/jsonStore";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Adds a manual note to the project timeline (e.g. "Client confirmed by phone"). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { description?: string };
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }
  const projects = await readCollection<Project>("projects");
  if (!projects.some((p) => p.id === params.id)) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const event = await addEvent(params.id, "note", body.description.trim());
  return NextResponse.json(event, { status: 201 });
}
