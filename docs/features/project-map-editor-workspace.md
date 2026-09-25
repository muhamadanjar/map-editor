# Project map editor workspace

**Plan:** [project-map-editor-workspace.md](../plans/project-map-editor-workspace.md)  
**Progress:** [project-map-editor-workspace.md](../progress/project-map-editor-workspace.md)

## What it does

The Map Editor is an input-only workspace for Tileserver Projects. Start by selecting a Project. The workspace then uses that Project's single geometry type and form schema to create one new Feature.

Saved Features are visualized on the map and listed in a read-only table. Selecting **Fokus** on a table row moves the map to that Feature. Editing and deletion intentionally remain in the separate data-management application.

The Feature table begins as a compact bottom dock. Select **Buka tabel** to inspect rows, then **Tutup tabel** to return map space. When a Project has more than ten saved Features, use the pagination controls below the table to move between pages; the table remains read-only. The map navigation cluster on the right provides zoom in/out, reset-north, and **Fokus seluruh workspace**, which frames all saved Features for the active Project (or restores the default editor extent when the Project has no saved Features).

## Input flow

1. Select a Project from the chooser or switcher.
2. Select **Tambah Point**, **Tambah Line**, or **Tambah Polygon** according to the Project type.
3. Click the map to place coordinates. For lines and polygons, select **Selesai** after providing enough vertices.
4. Complete the form shown in the dialog (desktop) or sheet (small screens).
5. Select **Simpan Feature**. The new Feature is posted to Tileserver, then appears on the map and in the table.

Changing Project while an input is in progress requires confirmation and discards the draft after confirmation.

## API and configuration

The browser calls the same-origin proxy under `/api/tileserver/api/v1`. The proxy forwards only `/api/v1` paths to Tileserver, using `TILESERVER_API_URL` when set or `http://localhost:8050` by default.

The workspace uses:

- `GET /api/v1/projects`
- `GET /api/v1/projects/{project_id}/features`
- `GET /api/v1/projects/{project_id}/features.geojson`
- `POST /api/v1/projects/{project_id}/features`

MapLibre renders the OpenStreetMap basemap. `@muhamadanjar/layers` creates the DeckGL GeoJSON Feature overlay.

## Scope limits

- No Project/schema management, publishing, Feature edit, Feature delete, or attachment upload.
- Form fields typed as `file` are visibly identified as managed by the separate data-management app; this workspace does not fabricate a file upload.
