# Project settings form

**Plan:** [project-settings-form.md](../plans/project-settings-form.md)
**Progress:** [project-settings-form.md](../progress/project-settings-form.md)

The dashboard can now create a project and maintain everything the public guest form and the geometry validator depend on. Previously the dashboard could only read projects, so a guest form could never be switched on without a hand-written request against Tileserver.

## Opening the dialog

- **Create:** the *Project baru* button above the project list on the empty-project screen.
- **Edit:** *Pengaturan project* under the draw button in the active-project panel.

Both open the same dialog with four tabs: **Identitas**, **Form Schema**, **Guest**, **Geofence**. `Esc` closes it.

## Identitas

Name, description, and geometry type. The slug field is not here — it lives under Guest, because a slug only means something in terms of a public link.

`geometry_type` is locked once a project exists. Tileserver has no field to change it and existing features depend on it, so a different shape means a different project. The tab shows the locked value and says so.

## Form Schema

An ordered list of attribute columns. Each row has a name (the attribute key), a display label, a type, a required flag, and type-specific inputs:

| Type | Extra inputs |
| --- | --- |
| Teks pendek, Paragraf, Tanggal, Centang | — |
| Angka | Minimum, maksimum |
| Pilihan tunggal, Pilihan jamak | Opsi, one per line |
| Lampiran | Ekstensi yang diizinkan |

Arrows reorder a column and the bin removes it. Saving writes the whole schema at once, because `PUT /projects/{id}/schema` is a replace rather than a merge.

**Column names** must start with a letter or underscore and may then contain letters, digits, and underscores, matching the Tileserver rule exactly. Duplicate names are rejected with the row number of the first use.

Two fields are worth calling out:

- A **Lampiran** column is managed outside Map Editor and cannot be filled from the dashboard.
- A **Lampiran** column breaks the guest form. Tileserver answers `409` on the public project endpoint, so the form is published but unusable. The editor warns about this, and the save is blocked while guest is on.

## Guest

This is the tab that makes `/guest/{slug}` resolve.

1. Tick **Aktifkan formulir guest publik**.
2. The slug is derived from the project name and stays in sync until you edit it yourself. It accepts lowercase letters, digits, and single hyphens.
3. Optionally set **Buka mulai** and **Tutup pada** to open the form for a window. Leave both empty for an always-open form.
4. Optionally require consent, set consent text, and link a privacy policy.
5. Save.

The status chip below the slug is the fastest way to tell whether a shared link will work:

| Chip | Meaning |
| --- | --- |
| Nonaktif | No slug, or guest is off. The public page answers `404`. |
| Terjadwal | Slug is set but the start time is still ahead. |
| Terbuka | Resolving now. |
| Ditutup | The end time has passed. |

The chip follows the *unsaved* form state, so it previews the result before you save, and it re-checks every 30 seconds so a window that opens or closes is noticed without a reload. **Salin tautan** copies the absolute URL and **Buka** opens the public form in a new tab.

Without a slug and the enable flag, Tileserver resolves no project and the guest page answers `404` — that is the exact failure this tab exists to prevent.

## Geofence

An optional polygon that bounds where features and guest submissions may be drawn. Tileserver rejects anything outside it with `422`.

The fence is drawn **on the workspace map behind the dialog**, not on a second map. Tick *Gambar di peta*, then click the map to drop vertices; three is the minimum. While drawing, the dialog stops blocking the map, so click anywhere outside the panel.

- **Terapkan geofence** saves the polygon.
- **Hapus geofence** removes it and frees drawing everywhere again.
- The panel reports geometry type, vertex count, and bbox in mono.

The geofence tab saves on its own buttons rather than through *Simpan perubahan*, because a fence is validated independently against every existing feature. If a new fence would strand features that are already stored, Tileserver rejects it and the tab reports how many features are in the way.

A saved fence stays visible on the map as a dashed muted-blue boundary, and the active-project panel shows a `GEOFENCE AKTIF` marker, so a constrained project never looks unconstrained.

## How saving works

*Simpan perubahan* covers Identitas, Form Schema, and Guest, and runs in a fixed order:

1. `PUT /api/v1/projects/{id}/schema` — only when the schema actually changed.
2. `PATCH /api/v1/projects/{id}` — identity and guest fields.

The order matters. `PATCH` re-checks the guest configuration against the *stored* schema, so a single save that removes a file field and switches guest on only succeeds if the schema lands first.

Blank guest fields are sent as explicit `null` rather than omitted. Tileserver reads `model_fields_set` for those fields, so omitting one means "leave it alone" and only an explicit `null` clears it.

A blank description is stored as an empty string rather than `null`, because the server treats `null` as "no change" for that field.

## Validation

The dialog blocks the request and jumps to the offending tab when:

- the project name is empty, or the geometry type is unset on create;
- the slug contains anything but lowercase letters, digits, and single hyphens;
- a column name is malformed or duplicated, a label is empty, an unknown type is selected, or a `min` is greater than a `max`;
- a Pilihan column has no options, or a Lampiran column has no extension;
- guest is enabled with no slug, or guest is enabled while a Lampiran column exists.

Everything else comes back from Tileserver as a message in the red banner at the top of the dialog.

## After saving

The project list is re-sorted and a created project is opened immediately. A green notice confirms the outcome and, when the guest form is live, spells out the path that now works.

## Notes

- Publishing and project deletion are not exposed here. The dialog is read-only for `is_published` and offers no destructive project action.
- Geofence state belongs to the workspace rather than the dialog because the draw interaction lives on the shared map.
- The dialog writes through `/api/tileserver/*`, which now passes through `PATCH`, `PUT`, and `DELETE` in addition to `GET` and `POST`.
