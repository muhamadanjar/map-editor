import { MapEditorAuthenticationView } from "@/features/auth/views/map-editor-authentication-view";

export function ProjectWorkspaceView({ authError }: { authError?: string }) {
  return <MapEditorAuthenticationView authError={authError} />;
}
