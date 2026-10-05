import { AuthenticationGate } from "../components/authentication-gate";

export function MapEditorAuthenticationView({ authError }: { authError?: string }) {
  return <AuthenticationGate initialError={authError} />;
}
