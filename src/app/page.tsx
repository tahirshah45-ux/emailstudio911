import AppShell from "@/components/layout/AppShell";
import ProjectsDashboard from "@/components/projects/ProjectsDashboard";

export default function Home() {
  return (
    <AppShell>
      <ProjectsDashboard />
    </AppShell>
  );
}
