# Progress: Workspace dock, navigation, and login surface

**Plan:** [workspace-dock-navigation-login.md](../plans/workspace-dock-navigation-login.md)

## Discovery

- The editor toolbar is a long vertical rail at the right of the map.
- The Feature table is rendered as a persistent bottom surface, including when collapsed.
- Map Editor contains no login route, authentication client, session manager, or configured authentication API. The TileServer proxy only forwards an existing authorization header.
- The workspace already uses Radix Dialog primitives and the project design system defines the map as the dominant surface.

## Implementation

- Reworked `MapEditingToolbar` into a compact bottom dock. It starts collapsed with explicit editor and table controls, then wraps its tool controls safely when expanded on narrow screens.
- Moved the saved-Feature table toggle into the dock. The table is rendered only when open and floats above the dock, so it no longer reserves persistent canvas space.
- Added `WorkspaceNavbar` with the Project switcher, active geometry/count status, and login trigger.
- Added a Radix-based login modal with visible labels, password-manager autocomplete, keyboard dismissal, focus management, and explicit no-auth-service feedback rather than a fabricated login state.

## Verification

- `pnpm exec tsc --noEmit` - passed.
- Focused ESLint for dock, navbar, table, map, and workspace - passed.
- `git diff --check` - passed.
- `graphify update .` - completed (893 nodes, 1201 edges).
- Browser smoke test is pending: the local Chrome distribution is absent and the permitted browser installation failed in this environment.
