import { NextRequest, NextResponse } from "next/server";
import { addEvent, eventsForProject } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const projects = await readCollection<Project>("projects");
  const project = projects.find((p) => p.id === params.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const [events, emails] = await Promise.all([
    eventsForProject(project.id),
    readCollection<EmailDocument>("emails"),
  ]);

  const communications = emails
    .filter((e) => e.projectId === project.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ contentHtml, history, ...rest }) => ({ ...rest, historyCount: history.length }));

  return NextResponse.json({ project, events, communications });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Project>;
  const projects = await readCollection<Project>("projects");
  const idx = projects.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const prev = projects[idx];
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
  projects[idx] = next;
  await writeCollection("projects", projects);

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
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const projects = await readCollection<Project>("projects");
  const next = projects.filter((p) => p.id !== params.id);
  if (next.length === projects.length) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  await writeCollection("projects", next);
  return NextResponse.json({ ok: true });
}
