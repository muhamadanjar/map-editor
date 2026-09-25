# Map Editor Development Guide

This file provides guidance to agent tooling (Claude Code, opencode, etc.) when working with code in this repository. It doubles as `AGENTS.md` via symlink.

## Design Context

Full strategic and visual specs live in `PRODUCT.md` and `DESIGN.md` at the project root (generated/maintained via the `impeccable` skill). Read them before any UI work.

- **Register:** product (app UI, design serves the geospatial workflow — not marketing/brand).
- **North Star:** map-first cartographic instrument UI based on `templates/Geoportal.dc.html`; floating warm-neutral chrome recedes so the map stays the focus.
- **Color:** white/warm-neutral surfaces, teal operational actions (`#0f6b5f`), muted-blue selection (`#67a2c5`), and red destructive states. Layer-type badges remain the sanctioned categorical exception.
- **Typography:** IBM Plex Sans for UI and IBM Plex Mono for coordinates, IDs, counts, and raw attribute values.

## Tech Stack

- **Framework:** Next.js 16.2.4 (React 19.2.5)
- **Language:** TypeScript 6.0.3
- **State Management:** Zustand (with devtools in dev mode)
- **Geospatial Visualization:** DeckGL (deck.gl) + MapLibre GL
- **Styling:** Tailwind CSS 4.2.4 + shadcn/ui components
- **Geospatial Utils:** Turf.js for analysis (buffer, distance, etc.)
- **Map Tiles:** Support for MVT, WMS, WFS, GeoJSON, Raster Tiles via Adapter pattern

## Build & Dev Commands

## Repository & Workflow Notes

- This project is part of a monorepo, so changes should be made with awareness of shared packages, sibling services, and cross-service dependencies.
- When working in the main or master branch, use the repository SSH URL for remote access when SSH is expected by the environment; use the HTTP URL only if that is the required convention for the task.
- Keep remote repository usage consistent with the project’s existing configuration and avoid switching between SSH and HTTP URLs unnecessarily.


```bash
# Start dev server (localhost:3000)
pnpm run dev

# Build for production
p
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Audit dependencies
npm audit
npm audit fix

# Update dependencies
npm outdated
npm update
npm i <package>@latest
```

### State Management (Zustand)

**mapStore.ts:** Single global store for map state.

**CRITICAL PATTERN - Use individual selectors, NOT destructuring:**

```typescript
// ❌ BAD: Reference pollution (all values get new refs on any change)
const { layers, activeAnalysisTool, viewState, ... } = useMapStore();

// ✅ GOOD: Only subscribe to what you need
const layers = useMapStore((state) => state.layers);
const activeAnalysisTool = useMapStore((state) => state.activeAnalysisTool);
```

**Why:** Zustand destructuring subscribes to ALL state. When any state changes, all values get new references (even unchanged ones). This forces unnecessary re-renders → infinite loops.

**CRITICAL PATTERN - Fire-and-forget async in store:**

```typescript
// ❌ BAD: Async causes setState during render
getTileInfoAtClick: async (clickInfo) => {
  const infos = await LayerInfoProvider.get...();
  set({ ... }); // Happens async, breaks React batching
}

// ✅ GOOD: Fire-and-forget IIFE
getTileInfoAtClick: (clickInfo) => {
  (async () => {
    const infos = await LayerInfoProvider.get...();
    set({ ... }); // Isolated from sync handler
  })();
}
```

**Why:** Async mutations inside store actions can interfere with React's batching → infinite setState loops. IIFE isolates async work from sync click handlers.

**CRITICAL PATTERN - Read state dynamically in callbacks:**

```typescript
// ❌ BAD: Deps on activeAnalysisTool cause recreation
const handleClick = useCallback(() => {
  if (activeAnalysisTool) { ... }
}, [activeAnalysisTool]); // New ref when tool changes

// ✅ GOOD: Read state at call time, no deps
const handleClick = useCallback(() => {
  const state = useMapStore.getState();
  if (state.activeAnalysisTool) { ... }
}, []); // Stable ref forever
```

**Why:** Callback refs change on deps → deckLayers recalculate → new click handlers → immediate fire → loop.

### Component Structure

**File naming:** kebab-case (e.g., `map-container.tsx`, `layer-card.tsx`)
**Component names:** PascalCase (e.g., `export function MapContainer`, `export function LayerCard`)

**Main feature files:**
- `features/maps/views/geoportal-workspace-view.tsx` — page-level workspace composition
- `features/maps/components/map-container.tsx` — DeckGL + MapLibre rendering and click handling
- `features/maps/components/analysis-tools-panel.tsx` — buffer and measurement tools
- `features/maps/components/feature-preview.tsx` — compact selected-feature preview
- `features/maps/components/feature-detail-drawer.tsx` — complete selected-feature attributes
- `features/maps/components/catalog-panel.tsx` — catalog and active-layer composition
- `features/maps/components/layer-manager-panel.tsx` — visibility and opacity controls
- `features/maps/components/layer-type-badge.tsx` — domain-aware layer type badge
- `features/maps/stores/map-store.ts` — Zustand map and feature state


## File Organization

```
/app
  /page.tsx          → Thin route rendering GeoportalWorkspaceView

/components/ui       → Domain-agnostic reusable primitives only

/features/maps
  /components        → Map, workspace, catalog, layer, and drawer UI
  /views             → Page-level feature composition
  /types             → Layer, map, tile, and Tileserver types; exported via index.ts
  /hooks             → Catalog, layer, debounce, and tile hooks
  /stores            → Zustand map store
  /api               → Tileserver API client

/lib/utils.ts        → Domain-agnostic utilities

/public
  /data/             → Sample GeoJSON files
```



## Testing

No test framework currently set up. For future:
- Unit tests for adapters (mock DeckGL, Zustand)
- Integration tests for layer factory + store
- E2E tests for map interactions (Playwright/Cypress)


## Rules

### Codebase Navigation

Use the knowledge graph (graphify or codebase-memory-mcp) before raw grep/glob:

- **graphify:** Run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. Browse `graphify-out/wiki/index.md` for broad navigation. Read `graphify-out/GRAPH_REPORT.md` only for architecture reviews.
- **codebase-memory-mcp:** Use `search_graph`, `trace_path`, and `get_code_snippet` for structural queries and call-graph tracing.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Fall back to grep/`rg`, `Glob`, or direct file reads when graphify/codebase-memory is unavailable or insufficient.

### Documentation Workflow (mandatory when writing code)

- **Plan:** Every new feature or architectural design MUST be documented in `docs/plans/[feature-name].md` before any code is written.
- **Progress:** Execution MUST be recorded in `docs/progress/[feature-name].md`, with a prominent link back to its plan at the top.
- **Feature docs:** Once complete (Definition of Done), write the final user/developer documentation in `docs/features/[feature-name].md` — focused on *how the feature works* and *how to use it*. Link it back to the original plan and progress files.
- **Workflow strictness:** Do not start writing code before both the plan and progress files are initialized and linked.

### Components
- Treat `components/ui/` as the base UI module for reusable, domain-agnostic primitives only, such as buttons, dialogs, inputs, tabs, cards, and data-grid building blocks.
- Components in `components/ui/` must not contain feature-specific business rules, page orchestration, feature API calls, or imports from `features/`.
- When a UI element knows about a domain concept or is used to compose a feature page, keep it inside the owning feature module instead of `components/ui/`.

- Every feature module that backs a page must live under `features/` and contain these folders:
  - `components/` — feature-specific reusable UI and interaction components.
  - `views/` — page-level feature composition consumed by route files under `app/`.
  - `types/` — feature-owned domain, API, form, and view-model types; expose shared feature types through `types/index.ts` when appropriate.
- A feature module may be a top-level feature such as `features/users/` or a nested route-oriented feature such as `features/payment/products/` and `features/etl/jobs/`.
- Keep route files under `app/` thin: they should render a feature view and handle only route concerns such as params, metadata, or framework-specific loading boundaries.
- Additional folders such as `api/`, `hooks/`, `forms/`, `schemas/`, `stores/`, `tables/`, or `utils/` are optional and should be created only when the feature needs them.
- For new features, create the three required folders from the start. When modifying an existing feature that does not follow this structure, move the touched feature-owned files toward this structure without performing unrelated repository-wide migration.

Example:

```text
features/users/
├── components/
├── views/
├── actions/
├── types/
│   └── index.ts
├── api/       # optional
├── hooks/     # optional
└── forms/     # optional
```

### Git Operations — STRICTLY FORBIDDEN

**NO git write operations allowed:**
- ❌ `git commit` — FORBIDDEN
- ❌ `git push` — FORBIDDEN
- ❌ `git add` — FORBIDDEN
- ❌ `git rm` — FORBIDDEN
- ❌ `git merge` — FORBIDDEN
- ❌ `git rebase` — FORBIDDEN
- ❌ `git reset` — FORBIDDEN
- ❌ `git checkout` — FORBIDDEN
- ❌ `--force`, `--no-verify`, `--amend` flags — FORBIDDEN
- ❌ Any submodule operations — FORBIDDEN

**Only read-only operations allowed:**
- ✅ `git log` — View commit history
- ✅ `git status` — Check working tree status
- ✅ `git diff` — View changes
- ✅ `git show` — View commit details

**Why:** Multi-service monorepo with git submodules. Git operations must be coordinated at root by authorized personnel. Claude must never make autonomous commits or modify repository state.
