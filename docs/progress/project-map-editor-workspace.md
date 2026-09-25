# Progress: Project map editor workspace

**Plan:** [project-map-editor-workspace.md](../plans/project-map-editor-workspace.md)

## Discovery

- Confirmed Tileserver OpenAPI v1.11.1 is reachable through the host network.
- Confirmed Project, Feature list, GeoJSON, and create endpoints and verified their live response shapes.
- Confirmed the shared layers package exposes `layerFactory` and its GeoJSON adapter, suitable for a DeckGL overlay over MapLibre.
- Captured the project vocabulary and resolved user decisions in `CONTEXT.md`.

## Implementation

- Added a thin route entry point and the `features/projects` module with API, types, components, and view boundaries.
- Added a same-origin Next route proxy for permitted Tileserver `/api/v1` requests.
- Added MapLibre with an OpenStreetMap basemap and a DeckGL GeoJSON overlay supplied through `@muhamadanjar/layers`.
- Added explicit Project selection, geometry drawing for point/line/polygon Projects, responsive feature input dialog, read-only Feature table, map focus, success/error states, and draft-discard confirmation.
- Applied the Geoportal warm-neutral, teal, muted-blue, IBM Plex visual language and reduced-motion support.
- Refined the Feature table into a collapsible dock that starts closed and announces its expanded state.
- Added a dedicated map navigation component with zoom in/out, north reset, and workspace focus.
- Added ten-row client-side pagination for the read-only Feature table and replaced its collapse toggle with the shared Button component; pagination controls use the same accessible button styling.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- `pnpm exec eslint app features` — passed.
- Pagination and shared Button refinement re-checked with `pnpm exec tsc --noEmit` and `pnpm exec eslint app features` — passed.
- Fixed the Feature table Button import to match the repository's default-exported Button primitive and aligned pagination variants with its supported API.
- Dev server smoke test on the existing port 3006: `/` returned 200 and `/api/tileserver/api/v1/projects` returned the live Tileserver Project list with 200.
- Browser automation could not run because `agent-browser` is absent and the environment has no Playwright Chrome binary; installing Chrome was blocked by system dependencies.
- Production Turbopack build is blocked by the environment: sandbox cannot fetch Google Fonts, and host execution then hit a Turbopack internal CSS-process permission error. This is not a TypeScript or lint error; the dev server compiles and serves the application.
