# Map Editor authentication and guest identity

## Account identity in editor navigation

- After `/auth/info` validates the server-held session, expose only the authenticated user's `name` and `email` through the same-origin session endpoint.
- Pass the minimal account profile from the authentication gate to the workspace navbar and show both fields beside the sign-out control.
- Never expose access or refresh tokens to browser JavaScript.

## Goal

Require authentication before users can open the protected Map Editor or guest submission flow. Use UserManagement as the authority for Google identity validation, account records, project authorization, and application sessions.

## Confirmed decisions

- The Map Editor requires sign-in before opening protected editor content. Users may sign in with UserManagement credentials or Google.
- A Google identity used for editor access must be explicitly linked to an existing UserManagement account. Email matching alone never links accounts. An unlinked identity does not receive editor access.
- Project permissions are checked after authentication. Google sign-in alone does not grant access to every Project.
- Before guest sign-in, the guest route may show only the Project name and a Google sign-in action. It withholds the map, form schema, and submission controls until authentication succeeds.
- UserManagement validates Google identities and issues application sessions for both flows. On first guest sign-in, it creates a passwordless UserManagement account with the guest role.
- Guest accounts are global UserManagement users and may be reused across Projects. The guest role does not grant editor access; each guest flow is scoped to its target Project.
- If a guest's Google email already belongs to an unlinked UserManagement account, do not auto-link or create a duplicate. Require explicit linking through the existing account or an administrator before Google sign-in can continue.
- Google provides guest name and email; remove manual name/email entry and email OTP. Guest consent remains required. Phone and organization are collected only when configured as Project requirements.
- A Guest User may submit once per Project. A repeated attempt returns the prior submission status or reference code. The same account may submit to other Projects.

## Scope

1. Confirm the UserManagement contract for Google validation, explicit identity linking, passwordless guest provisioning, application session issuance, and project authorization.
2. Gate Map Editor routes and protected project data behind a valid UserManagement application session; support both UserManagement credentials and linked Google identities.
3. Gate guest project details, schema, map, and submission controls behind Google sign-in; keep only the Project name and sign-in action visible before authentication.
4. Integrate guest account provisioning and guest role handling with UserManagement, preserving per-Project submission limits and reference-code behavior.
5. Handle sign-in return paths, expired sessions, denied project access, unlinked identities, and unavailable authentication services.
6. Update the feature documentation after implementation and verification.

## Acceptance criteria

- A signed-out visitor cannot open protected Map Editor content or guest form/map content.
- An editor can authenticate with UserManagement credentials or with a Google identity explicitly linked to their UserManagement account.
- A Google identity without a linked editor account cannot access Projects; project permissions remain enforced independently of sign-in method.
- A first-time guest Google sign-in creates or reuses one passwordless guest account in UserManagement, without creating duplicate users by email.
- A guest account cannot access editor capabilities unless separately granted editor status and Project permissions.
- Guest submissions use Google-provided name/email, require consent, and collect phone/organization only when configured for the Project.
- Duplicate guest submissions are limited by Guest User and Project and show the prior status/reference code.
- Guest authentication does not expose the map or form schema before sign-in.

## Confirmed implementation contract

- UserManagement OAuth endpoints are `/oauth/authorize` and `/oauth/token` under its `/api/v1` API prefix. The public client flow requires Authorization Code + PKCE S256.
- The OAuth token is opaque; exchange it through `/auth/oauth-exchange` to obtain UserManagement JWTs. The OAuth client must be configured as first-party for that exchange. The app ID used by Tileserver is configured server-side through `USERMANAGEMENT_APPLICATION_ID`.
- JWT refresh and sign-out use `/auth/refresh` and `/auth/logout`, respectively.
- UserManagement's hosted authorization page owns credential collection. Map Editor must not collect, proxy, or log UserManagement passwords.
- Map Editor exchanges the authorization code server-side and stores access/refresh tokens only in HttpOnly same-site cookies. Its same-origin Tileserver BFF adds the access token to upstream requests.
- Register `MAP_EDITOR_PUBLIC_URL/api/auth/callback` as the OAuth redirect URI and mark its OAuth client first-party. Keep the optional OAuth client secret server-only when using a confidential client; the browser never receives it.
- Google sign-in uses UserManagement `/auth/social/google/login` with the same Authorization Code + PKCE callback. UserManagement must list the Map Editor OAuth client ID in `SOCIAL_EXPLICIT_LINK_OAUTH_CLIENT_IDS`; Map Editor also requires its server-side `USERMANAGEMENT_GOOGLE_LINK_ONLY_ENABLED=true` and UI `NEXT_PUBLIC_USERMANAGEMENT_GOOGLE_SIGN_IN_ENABLED=true` before Google is available.
- Tileserver validates UserManagement JWTs and applies `tiles.read` to GET and `tiles.manage` to writes; per-Project checks remain authoritative at the API.
- The Google provider callback currently auto-links verified matching email addresses. Google login must remain disabled until UserManagement adds and enforces explicit-link-only behavior for this client.
- User approved preparing UserManagement changes; that repository requires its own plan/progress and filesystem write access before implementation.

## Readiness findings (2026-10-04)

- UserManagement has a Google social-login OAuth Authorization Code + PKCE flow at `/auth/social/{provider}/login` and a provider callback. The provider value is `google` when enabled.
- Its current social-login use case automatically links a verified Google email to an existing verified user, then creates a general passwordless user when no matching account exists. That conflicts with the agreed explicit-link rule and does not create a guest-only identity/role.
- Map Editor has no OAuth callback/session layer or configured UserManagement OAuth client. Its project API requests do not attach an authorization token. The Tileserver proxy can forward an `Authorization` header when present, but currently has no session from which to supply one.
- Tileserver verifies UserManagement JWTs and supports permission checks, but the current Map Editor calls do not provide authenticated user context. The guest submission API remains a separate public identity/OTP session flow.
- These gaps mean a frontend-only change would not enforce the agreed identity-linking, guest-role, or API authorization boundaries. UserManagement and Tileserver contracts/implementation must be brought into alignment before enabling the Map Editor gates.

## Out of scope

- Changing the Project geometry/form model or the guest route's input-only purpose.
- Giving guest role access to editor functions or granting Project access solely from a Google email/domain.
- Automatic account linking based only on email equality.
