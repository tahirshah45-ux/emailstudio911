import { NextRequest, NextResponse } from "next/server";
import { withApiErrors } from "@/lib/apiErrors";
import { collaborationForProject } from "@/lib/services/portalService";
import { COLLECTIONS, repo } from "@/lib/store";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Admin view: portals, submissions, documents, and signatures for a project. */
export const GET = withApiErrors("projects:collaboration", async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const project = await repo.get<Project>(COLLECTIONS.projects, params.id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json(await collaborationForProject(params.id));
});
