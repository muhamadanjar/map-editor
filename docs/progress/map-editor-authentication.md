# Progress: Map Editor authentication and guest identity

**Plan:** [map-editor-authentication.md](../plans/map-editor-authentication.md)

## Account identity in editor navigation

- [x] Confirm `/auth/info` as the profile source and identify the existing session-to-gate-to-workspace flow.
- [x] Return only `name` and `email` from the server session endpoint and render both in the navbar.
- [x] Refresh codebase graph and run the required UI convention detector (no findings).
- Feature guide: [Account identity in Map Editor](../features/map-editor-account-identity.md).

## Discovery

- Confirmed the product boundary through a grilling session: editor and guest flows require sign-in before protected content opens.
- Confirmed UserManagement is the central authority for Google validation, account records, guest provisioning, project authorization, and application sessions.
- Confirmed the current Map Editor login surface reports that authentication is unavailable; guest submission currently collects name/email manually and has an OTP step. The agreed design supersedes those guest identity steps after implementation.
- Confirmed Google identities for editor accounts require explicit account linking; email equality does not link identities.
- Confirmed first-time guest Google sign-in provisions a passwordless UserManagement account with guest role. Existing unlinked accounts are neither auto-linked nor duplicated.
- Confirmed per-Project authorization and one guest submission per account per Project, with an existing reference returned for repeats.

## Implementation

- Map Editor now has UserManagement OAuth2 Authorization Code + PKCE, server-side token exchange, HttpOnly access/refresh cookies, session validation/refresh, a protected workspace gate, and cookie-backed bearer injection in its same-origin Tileserver proxy.
- The BFF no longer accepts a browser-supplied bearer or application/permission header; it injects the session token and configured application ID. It also protects the Tileserver analysis-workspace bypass path.
- OAuth client configuration uses the callback `${MAP_EDITOR_PUBLIC_URL}/api/auth/callback`; client secret is optional and server-only. Sign-out revokes refresh tokens when a confidential client secret is configured.
- Map Editor Google OAuth2 initiation is implemented against UserManagement `/auth/social/google/login`; the UI button is disabled by default and the server endpoint also rejects initiation unless `USERMANAGEMENT_GOOGLE_LINK_ONLY_ENABLED=true`.
- UserManagement now supports explicit-link-only Google login for allowlisted client IDs. Enable Google only after adding the Map Editor client ID to `SOCIAL_EXPLICIT_LINK_OAUTH_CLIENT_IDS`, configuring Google provider credentials, and enabling both Map Editor flags.
- User approved preparing UserManagement changes. That repository's plan/progress must be initialized under its own guide and filesystem write access must be granted before code changes there.
- Guest route remains outside this first implementation slice; its UserManagement guest provisioning and one-submission-per-project contract still require coordinated service work.

## Verification

- Pending after implementation. No runtime, API, or browser verification has been performed.
