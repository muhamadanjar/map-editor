import { ProjectWorkspaceView } from "@/features/projects/views/project-workspace-view";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const params = await searchParams;
  return <ProjectWorkspaceView authError={params.auth_error} />;
}
