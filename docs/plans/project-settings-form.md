# Project settings form

**Progress:** [project-settings-form.md](../progress/project-settings-form.md)

## Problem

`map-editor-web` can read projects and draw features, but it cannot create or configure them. `features/projects/api/projects-api.ts` only wraps `GET /projects`, `GET|POST /projects/{id}/features`, and the GeoJSON URL — there is no create, no update, and no form-schema or geofence write path. The guest fields exist on the `Project` type (`features/projects/types/index.ts:24-31`) purely as a read model.

The consequence is concrete: `GET /api/v1/guest/projects/{public_slug}` returns `404 {"detail":"Guest project not found or unavailable"}` for every project, because Tileserver resolves guests with

```python
project.guest_enabled and project.public_slug is not None
and (project.guest_starts_at is None or project.guest_starts_at <= now)
and (project.guest_ends_at   is None or project.guest_ends_at   >= now)
```

and no project in the database has a `public_slug` or `guest_enabled = true`. Enabling guest submission today requires a hand-written `curl` against Tileserver.

## Goal

Give the dashboard a single settings surface that creates a project and maintains everything the guest flow and the geometry validator depend on: identity, form schema, guest publication, and geofence. The surface must make the guest link state legible, so an operator can tell "not configured" from "configured but not open yet" without reading server logs.

## Confirmed decisions

- One dialog serves both **create** and **edit**. Create requires `name` and `geometry_type`; everything else is optional.
- `geometry_type` is immutable after creation. Tileserver has no field for it in `ProjectUpdate`, and existing features depend on it. Changing it means creating a new project.
- The dialog has four tabs: **Identitas**, **Form Schema**, **Guest**, **Geofence**.
- The primary action saves Identitas + Form Schema + Guest. Geofence is spatially destructive and validated independently by the server, so it keeps its own explicit apply/remove controls inside the Geofence tab.
- Save order is `PUT /schema` then `PATCH /projects/{id}`. The schema must land first: `PATCH` validates guest configuration against the *persisted* schema, so a save that both removes a file field and enables guest only succeeds in this order.
- A pre-flight validation pass mirrors the server rules and blocks the request before any network call. This is the only guard on one path: `PUT /schema` does **not** re-validate the guest configuration, so without the pre-flight a single save can add a file field to a guest-enabled project and silently break the public form.
- Blank guest fields are sent as explicit `null`, never omitted. `update_project` reads `body.model_fields_set` for `public_slug`, `guest_starts_at`, `guest_ends_at`, `guest_consent_text`, and `guest_privacy_policy_url`, so an omitted key means "leave unchanged" and clearing requires an explicit `null`.
- `description` is the one exception: the server applies it with `if body.description is not None`, so `null` is a no-op. Empty input is sent as `""` and renders as blank.
- The Geofence tab draws on the existing workspace map instead of embedding a second MapLibre instance. One map, one draw interaction.
- Guest status is computed client-side with the same predicate the server uses and re-evaluated on an interval, so "terbuka" / "belum dimulai" / "sudah ditutup" / "nonaktif" is visible before anyone shares the link.
- While the fence is being drawn the dialog backdrop stops intercepting pointer events, so the map underneath stays clickable. The panel keeps capturing its own events. Without this the fence cannot be drawn at all, because a `fixed inset-0` modal covers the map.
- Publishing (`POST|DELETE /projects/{id}/publish`) and project deletion (`DELETE /projects/{id}`) stay out of scope; `is_published` is displayed read-only. The dashboard exposes no destructive project action, so a stray request cannot remove a project and its features.

## Server contract being targeted

Tileserver `v1.11.1` at `/home/anjar/Development/base-project-apps/services/tileserver_api`, proxied through the existing `app/api/tileserver/[...path]/route.ts`.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/v1/projects` | `ProjectCreate` | Requires `name`, `geometry_type`. Validates schema and guest config. |
| `PATCH` | `/api/v1/projects/{id}` | `ProjectUpdate` | Cannot change `geometry_type`. Re-validates guest config when enabled. |
| `PUT` | `/api/v1/projects/{id}/schema` | `{ form_schema }` | Full replace, not a merge. |
| `GET` | `/api/v1/projects/{id}/geofence` | — | `404` when unset. |
| `PUT` | `/api/v1/projects/{id}/geofence` | `{ geometry }` | Accepts raw geometry, `Feature`, or wrapper. Rejects a fence that would exclude existing features. |
| `DELETE` | `/api/v1/projects/{id}/geofence` | — | |

Server rules to mirror in `features/projects/utils/project-validation.ts`:

- `public_slug` → `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, trimmed and lowercased server-side.
- `guest_enabled = true` requires a `public_slug`.
- `guest_enabled = true` rejects any form field of type `file`.
- Form field `name` → `/^[a-zA-Z_][a-zA-Z0-9_]*$/`, unique across the schema.
- Form field `label` is required.
- Form field `type` ∈ `text | textarea | number | select | multiselect | date | checkbox | file`.
- `select` and `multiselect` require a non-empty `options` array.
- `number` bounds must be numeric when present.

## Design

Follows the existing `features/projects` register: floating warm-neutral chrome, teal `#0f6b5f` for operational actions, muted-blue `#67a2c5` for the geofence boundary, red `#c0392b` for destructive and blocked states, IBM Plex Mono for slugs, bboxes, and counts. Dialog shell mirrors `feature-input-dialog.tsx`: sticky header, scrollable body, footer actions, Escape to close, first field focused on open.

Geofence boundary uses the selection blue rather than teal so it reads as a constraint overlay, not a feature being drawn. The saved fence renders as a translucent fill plus a dashed outline and is visible whether or not the tab is open, so the operator always knows the project is fenced.

## Files

```
features/projects/
  types/index.ts                     + create/update inputs, geofence, mutable draft field
  utils/project-validation.ts        NEW  shared slug/schema/guest rules, guest availability
  api/projects-api.ts                + createProject, updateProject, replaceProjectSchema,
                                       getProjectGeofence, upsertProjectGeofence, deleteProjectGeofence
  components/project-picker.tsx      + "Project baru" entry
  components/project-settings-dialog.tsx    NEW  tab shell, save orchestration, error surface
  components/project-form-schema-editor.tsx NEW  ordered field builder
  components/project-guest-settings.tsx     NEW  guest config, live status, share link
  components/project-geofence-settings.tsx  NEW  draw/apply/remove
  components/project-map.tsx         + geofence source, fence draw mode
  components/project-workspace.tsx   + settings state, create flow, project refresh after save
app/api/tileserver/[...path]/route.ts + PATCH, PUT, DELETE pass-through
```

## Delivery

1. Types, validation module, and the six API client functions.
2. Extend the Tileserver proxy route to pass through `PATCH`, `PUT`, and `DELETE`. It only exported `GET` and `POST`, so every write in this feature would have answered `405`.
3. Geofence rendering and draw mode in `ProjectMap`.
4. Schema editor, then guest panel, then geofence panel.
5. Dialog shell wired into the workspace for both create and edit.
6. Type-check, lint, and a live smoke test against the running Tileserver.

## Definition of Done

- A project can be created from the dashboard with a name, geometry type, and form schema.
- `public_slug` and `guest_enabled` can be set and cleared from the dashboard, and `GET /api/v1/guest/projects/{slug}` then returns `200`.
- Guest open/closed status is visible in the dialog and matches the server's own predicate.
- A form schema can be edited, reordered, and removed from the dashboard.
- A geofence can be drawn on the workspace map, applied, and removed, with the server's "would exclude existing features" rejection surfaced in the UI.
- Validation blocks the request client-side for slug format, duplicate field names, missing options, and file-field-plus-guest combinations.
- `npx tsc --noEmit` and `npm run lint` pass.
- The existing drawing, feature table, and guest page flows are unchanged.

## Out of scope

- `geometry_type` changes, project deletion, layer binding, publish/unpublish.
- `multiselect`, `date`, and `checkbox` rendering in the feature input dialog — the schema editor can author them, and the existing input dialog keeps its current field coverage. Storing them is supported; filling them from the dashboard is not.
- File upload from the dashboard; file fields stay attachment-backed.
