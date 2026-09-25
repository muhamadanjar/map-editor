# Project map editor workspace

## Goal

Build a map-first input workspace for Tileserver Projects. A user explicitly selects one Project, draws exactly the Project's supported geometry, completes its form schema, and creates a new Feature. Existing Features remain visible and verifiable but are never edited or deleted here.

## Confirmed domain decisions

- A Project has exactly one geometry type; selecting a Project establishes the full input context.
- The initial state requires an explicit Project selection.
- MapLibre renders an OpenStreetMap basemap. `@muhamadanjar/layers` renders the saved Project FeatureCollection as a DeckGL GeoJSON overlay.
- The input flow is draw geometry, open the Project form, then submit.
- The Feature table and map overlay are read-only verification/navigation surfaces.
- A Project switch with an unsaved draft asks for confirmation, then discards the draft when confirmed.

## API contract

- `GET /api/v1/projects` lists Projects and their `geometry_type`, `form_schema`, and count.
- `GET /api/v1/projects/{project_id}/features` supplies Feature rows.
- `GET /api/v1/projects/{project_id}/features.geojson` supplies the map overlay.
- `POST /api/v1/projects/{project_id}/features` creates one Feature from `geometry` and `attributes`.
- A same-origin Next route proxies these endpoints so the browser does not depend on Tileserver CORS or host-network topology.

## UI design

- Use the Geoportal visual system: warm-neutral floating surfaces, teal for input actions, muted blue selection, IBM Plex font stacks, and compact mono data values.
- Center a Project chooser before activation. Once active, use a compact project switcher, geometry draw controls, project context, a bottom Feature table, and a responsive input dialog/sheet.
- Provide loading, empty, error, retry, confirmation, submitting, and success states. Keyboard focus stays visible; modal controls have labels and Escape closes a non-submitting form.

## Delivery and verification

1. Create the Project feature module, type/API boundary, and Tileserver proxy route.
2. Implement MapLibre map, share-layers overlay, controlled drawing, form, and table.
3. Apply visual tokens and responsive layouts.
4. Type-check, lint, build, update the code graph, and perform a browser smoke test against the running Tileserver.

## Out of scope

- Project creation, schema authoring, Feature update/delete, publishing, and upload/attachment lifecycle.

## UI refinement: map space and navigation

- The Feature table is a bottom dock that starts collapsed and exposes its full read-only table through an explicit toggle with `aria-expanded`.
- A dedicated map-navigation cluster exposes zoom in, zoom out, reset north, and **Fokus workspace**. Workspace focus fits all saved Features for the active Project, or resets to the default editor extent when none exist.
- Map controls remain clear of the table dock and use named, keyboard-focusable controls rather than relying only on gesture interaction.

## UI refinement: table pagination and controls

- Keep the read-only Feature table compact by showing ten rows per page with client-side pagination over the already loaded Project features.
- Use the shared `Button` component for the table collapse toggle and pagination controls, preserving visible focus, disabled states, and accessible labels.
