---
name: Geoportal
description: Map-first geospatial workspace for GIS analysts
source: templates/Geoportal.dc.html
colors:
  canvas: "#f6f6f5"
  surface: "#ffffff"
  surface-subtle: "#fbfbfa"
  surface-muted: "#f2f1ee"
  ink: "#1c1b19"
  ink-secondary: "#6b6760"
  ink-muted: "#9c9890"
  border: "rgb(0 0 0 / 10%)"
  teal-action: "#0f6b5f"
  teal-action-hover: "#0a5049"
  blue-selection: "#67a2c5"
  destructive: "#c0392b"
typography:
  ui: "IBM Plex Sans"
  data: "IBM Plex Mono"
register: product
---

# Design System: Geoportal

## North Star

Geoportal is a map-first operational workspace. Its white floating controls and warm-neutral panels behave like precise cartographic instruments: compact, legible, and calm. The map remains visually dominant.

`templates/Geoportal.dc.html` is the highest-priority canonical visual reference. When this document and the latest template conflict, the template wins. React components may differ structurally to provide semantic HTML, keyboard behavior, API integration, and maintainability, but composition, scale, rhythm, interaction hierarchy, and responsive states must remain visually faithful.

## Visual language

- IBM Plex Sans carries UI labels and prose; IBM Plex Mono carries coordinates, counts, IDs, and raw attribute values.
- The application chrome follows the latest template: it is light for Terang and Topo, then switches to the template's `ui-dark` treatment for Gelap and Satelit.
- White surfaces sit over the map with 10% black borders. Shadows are compact and reserved for floating or transient surfaces.
- Corners use 8px for compact controls, 12px for floating controls, and 16px for panels or drawers.
- Teal `#0f6b5f` marks primary actions and spatial operations.
- Muted blue `#67a2c5` marks the currently selected navigation or filter state.
- Red `#c0392b` is destructive or alert-only.
- Layer-type badges retain a categorical palette because color encodes data type.

## Application composition

### Map canvas

The map fills the viewport. All product UI floats above it. There is no permanent sidebar.

### Global controls

- Search sits at the top-left and opens the API-backed layer catalog.
- Account and notification controls sit at the top-right.
- Basemap choices and zoom controls sit below the account cluster.
- Coordinates and projection appear as a compact mono readout at the bottom-left on large screens.
- The overview map appears at the bottom-right on large screens.

### Workspace dock

A centered bottom dock exposes Katalog, Analisis, Legenda, Unduh, and Tabel. Only one workspace panel is active at a time. The Tabel drawer is an independent surface and may coexist with a panel.

### Workspace panel

On desktop the panel can dock left, right, or bottom. On small screens it uses the available width above the dock. The header contains one title, docking controls on desktop, and a close action.

### Feature inspection

Selecting a feature opens a compact preview with its layer, coordinates, and leading attributes. A separate detail drawer provides all attributes. The attribute table contains only data returned by DeckGL or Tileserver; it never invents viewport rows.

## Component rules

- Filenames use kebab-case.
- React component names use PascalCase.
- Components subscribe to Zustand through individual selectors.
- API-backed content must expose loading, error, empty, and retry states.
- Every control and surface present in the canonical template remains visible in the production UI. Features without backend support are explicitly disabled or marked “Segera hadir”; they must not fabricate data, completed operations, or analysis results. Account and notification content are the only approved mock data.
- Buttons use semantic tokens; no hardcoded zinc/blue/red primitive variants.
- Interactive targets are at least 32px, with visible keyboard focus.
- Motion lasts 150–250ms and communicates state. Reduced motion is mandatory.

## Responsive behavior

- Desktop reference viewport: 1440×900.
- Tablet panels remain docked but use narrower widths and avoid covering the account or basemap controls.
- Mobile panels span the viewport with 8px outer margins. Dock labels collapse to icons; basemap selection becomes a bottom sheet; feature detail becomes a bottom drawer.
- Tables scroll within their drawer rather than expanding the page.

## Data integrity

The presentation layer must preserve the existing Tileserver catalog, layer detail, field, and feature APIs; the shared layer factory; and Zustand map behavior. Template demo data and demo analysis algorithms are not production data sources.

## Implementation scope

The parity target covers every surface and responsive state defined inside `templates/Geoportal.dc.html`. Links to `templates/Akun.dc.html` remain navigable account destinations, but implementing the separate account page is outside the Geoportal workspace parity scope.
