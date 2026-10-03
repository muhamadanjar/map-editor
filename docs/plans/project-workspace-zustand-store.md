# Project Workspace Zustand Store

## Goal

Move Project workspace data and map-editing session state out of component-local `useState` and into a feature-owned Zustand store, so map, table, toolbar, and workspace composition can share one explicit state source.

## Scope

- Store projects, active project identity, project features, feature revision, map draft/editing state, map focus, geofence data/drawing points, and selected Feature IDs/mode.
- Keep transient presentation state local to `ProjectWorkspace`: loading/error notices, form values, open dialogs, confirmation payloads, toasts, and operation-in-progress flags.
- Keep Terra Draw and MapLibre runtime objects in component refs; they are not serializable application state.
- Preserve existing API contracts and selection behavior: normal click selects one Feature, Shift-click toggles multi-selection, and an empty-map click clears selection.
- Do not migrate other features or routes as part of this change.

## Implementation

1. Add a `features/projects/stores/` store with typed state, explicit actions, and a reset action.
2. Replace ProjectWorkspace local state for the scoped data/editor state with individual Zustand selectors and store actions.
3. Preserve project switching, draft cancellation, topology, delete, geofence, map, table, and form behavior.
4. Document the store contract and update the project feature/progress documentation.
5. Refresh the code graph and run TypeScript checking; browser smoke remains a separate runtime gate.
