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
- Fixed the map drawing-state wiring so ProjectMap receives normal Feature drawing as well as geofence drawing. Added direct saved-Feature selection through the Select tool, stale-selection filtering, and confirmed saved-Feature deletion.
- Added a selected-Feature highlight source and resilient DeckGL click resolution. It validates IDs against Project data, then matches geometry, then uses the source index as a fallback.
- Map selection now uses ordinary clicks to select exactly one Feature; Shift-click toggles a Feature in the multi-selection. Clicking empty map space clears the selection. The dock shows the selected count and Merge label.
- Selection now reads the native `MouseEvent.shiftKey` from a capture-phase click listener on the map canvas and uses DeckGL only for hit-testing. MapLibre box-zoom is disabled while saved-Feature Select mode is active so Shift remains available as the multi-select modifier.
- Kept the Project geometry constraint intact: rectangle is accepted only by polygon Projects and is submitted as GeoJSON Polygon.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- Focused ESLint for the Project map, workspace, and editor toolbar — passed.
- `git diff --check` — passed.
- `graphify update .` — completed (915 nodes, 1237 edges).
- Latest canvas-event implementation: `pnpm exec tsc --noEmit` — passed.
- Browser smoke via Playwright CLI on the existing local dev server: page loaded with 0 console errors (4 warnings); normal click selected one Point Feature, Shift-click added a second (`2 dipilih`), Shift-click on a selected feature removed it, and clicking empty map space cleared selection. The current Polygon fixture has one Feature, so Merge enablement with two Polygons was not directly browser-tested.
