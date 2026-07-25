import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { PROJECT_STAGES } from "@/lib/domain/stages";
import { addEvent } from "@/lib/store/events";
import { COLLECTIONS, newId, repo } from "@/lib/store";
import type { EmailDocument, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withApiErrors("projects", async () => {
  const [projects, emails] = await Promise.all([
    repo.list<Project>(COLLECTIONS.projects),
    repo.list<EmailDocument>(COLLECTIONS.communications),
  ]);
  const withCounts = projects
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => ({
      ...p,
      communicationCount: emails.filter((e) => e.projectId === p.id).length,
    }));
  return NextResponse.json(withCounts);
});

export const POST = withApiErrors("projects", async (req: NextRequest) => {
  const body = (await req.json()) as Partial<Project>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const projects = await repo.list<Project>(COLLECTIONS.projects);
  const year = new Date().getFullYear();
  const seq = projects.filter((p) => p.referenceNumber.includes(`-${year}-`)).length + 1;
  const now = new Date().toISOString();

  const project: Project = {
    id: newId(),
    name: body.name.trim(),
    description: body.description?.trim() ?? "",
    clientName: body.clientName?.trim() ?? "",
    company: body.company?.trim() ?? "",
    clientEmail: body.clientEmail?.trim() ?? "",
    referenceNumber: body.referenceNumber?.trim() || `911M-${year}-${String(seq).padStart(3, "0")}`,
    stage: PROJECT_STAGES[0],
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await repo.set(COLLECTIONS.projects, project.id, project);
  await addEvent(project.id, "project_created", `Project "${project.name}" created (${project.referenceNumber}).`);
  return NextResponse.json(project, { status: 201 });
});
