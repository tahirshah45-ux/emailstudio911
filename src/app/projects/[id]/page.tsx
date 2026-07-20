import AppShell from "@/components/layout/AppShell";
import ProjectDetail from "@/components/projects/ProjectDetail";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <ProjectDetail projectId={params.id} />
    </AppShell>
  );
}
