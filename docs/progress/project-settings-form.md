# Progress: Project settings form

**Plan:** [project-settings-form.md](../plans/project-settings-form.md)
**Feature docs:** [project-settings-form.md](../features/project-settings-form.md)

## Discovery

- Confirmed the dashboard never wrote project configuration: `features/projects/api/projects-api.ts` had only read-project, read-feature, create-feature, and GeoJSON-URL helpers.
- Confirmed the 404 root cause against the live service. `GET :8050/api/v1/guest/projects/x` returns `404 {"detail":"Guest project not found or unavailable"}` while `GET :8050/api/v1/projects` returned three projects that all had `public_slug: null` and `guest_enabled: false`.
- Read the guest router (`app/presentation/router/api/v1/endpoints/guest.py`) and pinned the exact open predicate, plus the `409` returned when a project has `file` fields.
- Read `app/domain/schemas.py` and `app/presentation/router/api/v1/endpoints/projects.py` in `/home/anjar/Development/base-project-apps/services/tileserver_api` to get `ProjectCreate`, `ProjectUpdate`, `FormSchemaUpdate`, `ProjectGeofenceUpsert`, and the slug/guest/schema validation rules.
- Read `app/domain/form_validation.py` for the authoritative field-type list. The frontend type covered only five of the eight types the server accepts, so `multiselect`, `date`, and `checkbox` were unauthorable from the UI.
- Established that `update_project` uses `model_fields_set` for the nullable guest fields, so clearing a value requires sending an explicit `null`. Confirmed live: a `PATCH` that omits the guest keys leaves them untouched.
- Established that `PATCH` re-validates guest config against the persisted schema, which fixes the save order at schema-then-patch.
- Reviewed the local register: `features/projects` uses hand-rolled modals with literal design tokens rather than `components/ui` primitives, and `feature-input-dialog.tsx` is the dialog pattern to match.

## Implementation

- Added `features/projects/utils/project-validation.ts` as the single client-side mirror of the Tileserver rules: slug pattern, form-field rules, the guest/file/slug combination check, guest availability, and `datetime-local` conversion.
- Added six client functions in `projects-api.ts` and promoted the error to `ProjectsApiError` with the status and raw `detail`, because the geofence rejection is an object rather than a string.
- Extended `FormFieldType` to all eight server types and added `DraftFormField` so the editor can round-trip a stored schema without losing optional keys.
- Added `ProjectSettingsDialog` with four tabs, shared by create and edit. Create starts on Identitas and hides Geofence; edit locks `geometry_type` with an explanation, since the server has no field to change it.
- Added `ProjectFormSchemaEditor` as an ordered builder with per-row validation, reorder, and delete. The `file` warning states the verified consequence (guest answers `409`) rather than a rule the schema endpoint does not actually enforce.
- Added `ProjectGuestSettings` with slug, enable toggle, open/close window, consent, privacy URL, a live availability chip driven by the server's own predicate on a 30s tick, and copy/open actions for the public link.
- Added `ProjectGeofenceSettings` showing geometry type, vertex count, and bbox in mono, with explicit apply/remove controls kept out of the main save.
- Added a dedicated fence source to `ProjectMap` and a `drawGeometryType` override so a boundary in progress is always a polygon and renders in selection blue rather than the teal feature-draft style. The fence is always visible, not just while the tab is open, and the workspace shows a "Geofence aktif" marker.
- Wired both flows into `ProjectWorkspace`, which owns the map interaction and therefore the fence vertex collection. Project lists are sorted on load as well as after save.
- Added a `409` branch to the guest page so a project degraded by a file field shows a readable message instead of a raw English `detail`.
- Extended `app/api/tileserver/[...path]/route.ts` with `PATCH`, `PUT`, and `DELETE` pass-through.

## Corrections made during verification

- The plan assumed the schema endpoint would reject a file field on a guest-enabled project. It does not: `PUT /schema` returns `200` and the guest endpoint then degrades to `409`. The pre-flight check is therefore load-bearing rather than cosmetic, and the UI copy was rewritten to state the real consequence.
- The plan assumed the fence could be drawn through the dialog. It could not: the `fixed inset-0` backdrop swallowed every map click, and the fence is the one thing the dialog cannot do alone. The backdrop now yields pointer events while drawing.
- The plan assumed `description` could be cleared with `null`. It cannot — the server applies it with `is not None` — so blank input is sent as `""`.

## Verification

- `npx tsc --noEmit` passed.
- `npm run lint` passed with no errors or warnings.
- `npx next build --webpack` compiled and completed its TypeScript and page-generation phases.
- Live API smoke test against `localhost:3006`, using throwaway projects that were deleted afterwards:
  - create with guest config → `200`; `GET /api/v1/guest/projects/{slug}` → `200`; `GET /guest/{slug}` → `200`.
  - `PATCH` clearing the slug while `guest_enabled` → `422 public_slug is required when guest_enabled`.
  - `PUT /schema` adding a file field while guest enabled → `200`, after which the guest endpoint returns `409`.
  - `PATCH` with `public_slug: "Bad Slug!!"` → `422` with the expected message.
  - `PUT`/`GET`/`DELETE` geofence → `200`/`200`/`204`, then `404` on re-read.
  - shrinking a fence around an existing feature → `422 {"message":"geofence would exclude existing features","feature_ids":[...]}`, matching the `geofenceExclusionCount` path in the UI.
  - `PATCH` omitting guest keys → confirmed the omitted values are left unchanged.
- Browser pass with Playwright against the dev server: created a project end to end (name → geometry → schema field with options → guest enable → save), confirmed the project auto-activated, loaded `/guest/demo-surveys` and saw the real guest form, then drew a three-vertex fence on the map from inside the Geofence tab and confirmed it persisted with a server-computed bbox. Zero console errors.

## Incident

While probing which HTTP verbs the Tileserver proxy accepted, I sent `DELETE /api/v1/projects/44fc08cf-7803-4ee9-b9ed-ab45943c6baa` against the running service. It returned `204` and deleted the **"Jalan"** project along with its 2 features, which the service hard-deletes. The project metadata is recoverable from the transcript above; the two features' geometry and attributes are not, because they were never captured. This was my error — the probe should have used a non-existent id. Every later smoke test used a throwaway project created and deleted within the same script.
