import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { Checklist, ChecklistItem, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withApiErrors("projects:checklists", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const checklists = await repo.query<Checklist>(COLLECTIONS.checklists, "projectId", params.id);
  return NextResponse.json(checklists.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
});

export const POST = withApiErrors("projects:checklists", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = (await req.json()) as { name?: string; items?: string[] };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Checklist name is required." }, { status: 400 });
  }
  const project = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const now = new Date().toISOString();
  const items: ChecklistItem[] = (body.items ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ id: newId(), text, done: false }));

  const checklist: Checklist = {
    id: newId(),
    projectId: project.id,
    name: body.name.trim(),
    items,
    createdAt: now,
    updatedAt: now,
  };
  await repo.set(COLLECTIONS.checklists, checklist.id, checklist);
  await addEvent(project.id, "checklist_added", `Checklist added: "${checklist.name}".`);
  return NextResponse.json(checklist, { status: 201 });
});
