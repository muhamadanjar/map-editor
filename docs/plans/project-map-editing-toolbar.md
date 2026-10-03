# Project map editing toolbar

## Goal

Add an ArcGIS-inspired, map-first editing toolbar to the Project workspace. It must create the geometry supported by the active Project, including an axis-aligned rectangle for polygon Projects, and let a user select and adjust the unsaved draft before opening the existing feature form.

## Scope and constraints

- Use the installed Terra Draw MapLibre adapter; it is the source of truth for an in-progress geometry only.
- Keep the existing `POST /projects/{project_id}/features` submission contract and read-only saved Feature overlay unchanged.
- Provide point, line, polygon, rectangle, select/edit-vertex, undo, redo, and clear-draft controls.
- Integrate cut and merge for saved Polygon Features with the Project topology API. The toolbar only initiates the workflow; confirmation and server validation remain the commit boundary.
- Restrict geometry creation to the active Project's declared type; rectangle is an alternate polygon input, not a new persisted geometry type.

## Interaction design

- The compact vertical toolbar floats beside the map navigation cluster and uses the project warm-neutral/teal/blue tokens.
- Buttons are keyboard-operable, named, expose `aria-pressed` where applicable, and retain a visible focus treatment.
- While a draft is active, the Select tool exposes Terra Draw's vertex handles. Undo/redo operate on the draft session.
- Cut starts a LineString sketch for one checked Polygon Feature. Merge uses two or more checked Polygon Features; the first checked Feature is the retained target.
- The existing finish/cancel/form flow remains the commit boundary; clearing or cancelling never affects saved Features.

## Verification

1. Run TypeScript and lint checks.
2. Run `graphify update .`.
3. Perform a browser smoke test when the local browser runtime is available.
