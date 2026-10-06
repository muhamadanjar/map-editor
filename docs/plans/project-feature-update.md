# Project Feature Update Plan

Progress: [implementation log](../progress/project-feature-update.md)

## Goal

Let an editor update a saved Project Feature's schema-backed attributes and geometry in one edit session, then persist both through the existing TileServer update contract.

## Agreed behavior

- Start editing from the saved feature table row.
- Keep the map interactive while the attribute form remains visible in a non-modal panel.
- Allow moving the whole feature and moving, adding, or deleting vertices.
- Save geometry and attributes together with one action.
- Keep feature ID and system metadata immutable; attachment fields stay managed by the external application.
- Validate geometry against the Project geometry type and required attributes before save; TileServer remains authoritative.
- Keep the draft and form values after a failed request so the user can retry.
- Confirm before discarding unsaved changes.
- Show GPS accuracy with a soft-blue radius and a subtle location pulse; respect reduced-motion preferences.

## Existing implementation and API

- Project workspace currently creates saved features from a new-geometry draft and an attribute dialog.
- Saved features can be focused and selected; the table is read-only for attributes.
- TileServer already exposes `PATCH /api/v1/projects/{project_id}/features/{feature_id}` accepting optional geometry and attributes. Confirm exact request/response and validation behavior while implementing; do not add a parallel mutation route.
- TileServer owns the persisted feature mutation. The frontend should replace the saved feature from the API response and retain the local draft on errors.

## Implementation steps

1. Inspect the frontend workspace, map editing adapter, validation helpers, and TileServer PATCH contract.
2. Add an explicit edit session with original feature, mutable geometry draft, attribute values, and dirty/discard state.
3. Extend saved-feature map editing so only the active feature is editable; preserve the existing draw, select, cut, merge, and delete flows.
4. Add an Edit action to each table row and a non-modal attribute panel with a single save action.
5. Add a typed frontend PATCH client and apply the server response to workspace state; retain edits and show actionable errors on failure.
6. Document the completed user flow and record scoped validation evidence.

## Acceptance criteria

- A saved feature can enter edit mode from its table row and is visibly identified on the map.
- Geometry edits support feature translation and vertex insertion, movement, and deletion.
- Attributes come from `form_schema`; system fields and file fields are not editable.
- One save request includes both the edited geometry and schema-backed attributes.
- Success replaces the saved feature from the server response and ends edit mode.
- Failure preserves all edits and shows the API error for retry.
- Canceling a dirty edit requires confirmation; confirming restores the original feature and values.
- Invalid geometry or required values cannot be submitted, and the server remains authoritative.
- GPS accuracy remains visible as a soft-blue radius, with a soft-blue pulse centered on the current fix.

## Constraints

- Follow `DESIGN.md`: map-first composition, warm-neutral panels, teal operational controls, and usable responsive layouts.
- Do not fabricate persistence or route around TileServer.
- Keep unrelated workspace behavior and existing local changes intact.
