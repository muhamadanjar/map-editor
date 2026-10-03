# Progress: Project map editing toolbar

**Plan:** [project-map-editing-toolbar.md](../plans/project-map-editing-toolbar.md)

## Discovery

- The Project workspace currently creates a feature by manually collecting map clicks; saved Features are deliberately read-only.
- `terra-draw` and `terra-draw-maplibre-gl-adapter` are already installed but unused.
- Terra Draw supports MapLibre adapters, draft snapshots, select/vertex manipulation, rectangle mode, and draft-session undo/redo.
- The Project topology API now exposes validated, idempotent Polygon cut and merge operations; its constraints are documented in `project-feature-topology.md` in the TileServer service.

## Implementation

- Added `MapEditingToolbar` as a floating, keyboard-accessible map instrument panel.
- Replaced manual Feature-draft click accumulation with the installed Terra Draw MapLibre adapter, while preserving the existing Project form and create request.
- Added point, line, polygon, rectangle, select/vertex-edit, undo, redo, and clear-draft interactions for the unsaved geometry session.
- Connected cut and merge to checked saved Polygon Features. Cut collects a LineString sketch, while merge treats the first checked Feature as the retained target and opens a confirmation before mutation.
- Kept the Project geometry constraint intact: rectangle is accepted only by polygon Projects and is submitted as GeoJSON Polygon.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- Focused ESLint for the Project map, workspace, and editor toolbar — passed.
- `git diff --check` — passed.
- `graphify update .` — completed (876 nodes, 1174 edges).
- Browser smoke test remains pending because no browser runtime was started for this change.
