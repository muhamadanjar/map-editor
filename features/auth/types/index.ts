export type AuthenticationState = "loading" | "authenticated" | "unauthenticated" | "unavailable";

export type AccountProfile = {
  name: string | null;
  email: string | null;
};
