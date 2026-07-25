import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, repo } from "@/lib/store";
import type { Checklist } from "@/lib/types";

export const dynamic = "force-dynamic";

export const PUT = withApiErrors("checklists", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = (await req.json()) as Partial<Checklist>;
  const prev = await repo.get<Checklist>(COLLECTIONS.checklists, params.id);
  if (!prev) return NextResponse.json({ error: "Checklist not found." }, { status: 404 });

  const next: Checklist = {
    ...prev,
    name: body.name?.trim() ?? prev.name,
    items: body.items ?? prev.items,
    updatedAt: new Date().toISOString(),
  };
  await repo.set(COLLECTIONS.checklists, next.id, next);

  // Record completion in the project timeline (once, on transition to complete).
  const wasComplete = prev.items.length > 0 && prev.items.every((i) => i.done);
  const isComplete = next.items.length > 0 && next.items.every((i) => i.done);
  if (!wasComplete && isComplete) {
    await addEvent(next.projectId, "checklist_completed", `Checklist completed: "${next.name}".`);
  }

  return NextResponse.json(next);
});

export const DELETE = withApiErrors("checklists", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const prev = await repo.get<Checklist>(COLLECTIONS.checklists, params.id);
  if (!prev) return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  await repo.remove(COLLECTIONS.checklists, params.id);
  return NextResponse.json({ ok: true });
});
