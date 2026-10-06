# Project Feature Update Progress

Plan: [Project Feature Update](../plans/project-feature-update.md)

## Status

- [x] User decisions collected for edit scope and save behavior.
- [x] Repository and graph discovery completed for the Project workspace.
- [x] Confirmed TileServer has an existing PATCH feature route in its indexed contract.
- [x] Inspect exact TileServer request/response and validation contract.
- [x] Implement saved geometry editing, attribute panel, and API client integration.
- [x] Add final feature documentation and record validation scope.

## Findings

- The current workspace has a create-only attribute form and a read-only feature table.
- The map workspace already has feature selection and a shared geometry editing session for new sketches.
- TileServer owns project feature persistence; its graph index reports `PATCH /{project_id}/features/{feature_id}` and an `update_feature` endpoint.
- The existing PATCH accepts optional geometry and attributes, validates geometry type/geofence and merged attributes, and returns the updated Feature.
- Map Editor seeds the selected saved Feature into Terra Draw Select mode with feature dragging, coordinate dragging, midpoint insertion, and coordinate deletion enabled.

## Decisions

- Use one edit session and one save for geometry plus attributes.
- Preserve the edit draft on save errors; prompt before discarding dirty edits.
- Keep file fields external and system identity fields immutable.

## Validation record

- `graphify update .` completed and refreshed the code graph.
- No test suite, typecheck, build, or browser flow was run in this implementation turn.
- The TileServer checkout already had unrelated working-tree modifications; it was inspected read-only and no TileServer files were changed because its PATCH endpoint already provides the required persistence contract.
