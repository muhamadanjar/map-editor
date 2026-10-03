# Progress: Project Workspace Zustand Store

**Plan:** [project-workspace-zustand-store.md](../plans/project-workspace-zustand-store.md)

## Discovery

- `ProjectWorkspace` owns Project, Feature, selection, draft, and geofence data in local React state.
- Zustand is already installed, but this checkout has no existing feature store to extend.
- MapLibre/Terra Draw instances remain imperative refs; transient dialogs, form values, notifications, and request status remain local presentation state.

## Implementation

- Added `features/projects/stores/project-workspace-store.ts` with typed data state, field updates, project activation/reset behavior, and draft reset behavior.
- Migrated projects, active project, features/revision, drawing draft/editor mode/session, feature selection/focus, and geofence/drawing points from `ProjectWorkspace` local state to Zustand.
- Kept presentation-only state and operation status local, and kept MapLibre/Terra Draw instances in refs.
- Preserved the selection contract: plain click selects one feature, Shift-click toggles multi-selection, and empty map click clears selection.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- Browser smoke test — not run.
