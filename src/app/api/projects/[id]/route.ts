import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { addEvent, eventsForProject } from "@/lib/store/events";
import { COLLECTIONS, repo } from "@/lib/store";
import type { Checklist, EmailDocument, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withApiErrors("projects", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const project = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const [events, emails, projectChecklists] = await Promise.all([
    eventsForProject(project.id),
    repo.query<EmailDocument>(COLLECTIONS.communications, "projectId", project.id),
    repo.query<Checklist>(COLLECTIONS.checklists, "projectId", project.id),
  ]);

  const communications = emails
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ contentHtml, history, ...rest }) => ({
      ...rest,
      approvalStatus: rest.approvalStatus ?? "none",
      sentAt: rest.sentAt ?? null,
      sentTo: rest.sentTo ?? null,
      historyCount: history?.length ?? 0,
    }));

  const checklists = projectChecklists.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ project, events, communications, checklists });
});

export const PUT = withApiErrors("projects", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = (await req.json()) as Partial<Project>;
  const prev = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!prev) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const next: Project = {
    ...prev,
    name: body.name?.trim() ?? prev.name,
    description: body.description?.trim() ?? prev.description,
    clientName: body.clientName?.trim() ?? prev.clientName,
    company: body.company?.trim() ?? prev.company,
    clientEmail: body.clientEmail?.trim() ?? prev.clientEmail,
    stage: body.stage ?? prev.stage,
    status: body.status ?? prev.status,
    updatedAt: new Date().toISOString(),
  };
  await repo.set(COLLECTIONS.projects, next.id, next);

  if (body.stage && body.stage !== prev.stage) {
    await addEvent(next.id, "stage_changed", `Stage moved: ${prev.stage} → ${next.stage}.`);
  }
  if (body.status && body.status !== prev.status) {
    await addEvent(
      next.id,
      body.status === "closed" ? "project_closed" : "project_reopened",
      body.status === "closed" ? "Project closed." : "Project reopened."
    );
  }

  return NextResponse.json(next);
});

export const DELETE = withApiErrors("projects", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const project = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  await repo.remove(COLLECTIONS.projects, params.id);
  return NextResponse.json({ ok: true });
});
