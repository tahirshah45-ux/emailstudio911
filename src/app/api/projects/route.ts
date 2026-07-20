import { NextRequest, NextResponse } from "next/server";
import { PROJECT_STAGES } from "@/lib/domain/stages";
import { addEvent } from "@/lib/store/events";
import { readCollection, writeCollection } from "@/lib/store/jsonStore";
import type { EmailDocument, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [projects, emails] = await Promise.all([
    readCollection<Project>("projects"),
    readCollection<EmailDocument>("emails"),
  ]);
  const withCounts = projects
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => ({
      ...p,
      communicationCount: emails.filter((e) => e.projectId === p.id).length,
    }));
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Project>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const projects = await readCollection<Project>("projects");
  const year = new Date().getFullYear();
  const seq = projects.filter((p) => p.referenceNumber.includes(`-${year}-`)).length + 1;
  const now = new Date().toISOString();

  const project: Project = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
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

  projects.push(project);
  await writeCollection("projects", projects);
  await addEvent(project.id, "project_created", `Project "${project.name}" created (${project.referenceNumber}).`);
  return NextResponse.json(project, { status: 201 });
}
