# Project map editing toolbar

**Plan:** [project-map-editing-toolbar.md](../plans/project-map-editing-toolbar.md)  
**Progress:** [project-map-editing-toolbar.md](../progress/project-map-editing-toolbar.md)

## What it does

The Project workspace includes a compact floating editing toolbar beside the map controls. It uses Terra Draw on the existing MapLibre map to create and refine the unsaved Feature geometry before the existing Project form is opened.

## Available tools

- Select: select the draft and drag its vertices to refine it.
- Point, line, and polygon: create the geometry declared by the active Project.
- Rectangle: an alternate way to create a Polygon Project geometry.
- Undo and redo: move through changes in the active draft session.
- Eraser: discard the active sketch without affecting saved Features.
- Select: without an active sketch, enters saved-Feature selection mode on the map. A normal click selects only that Feature; Shift-click adds or removes a Feature from the multi-selection. Clicking empty map space clears the selection.
- Delete: removes one or more selected saved Features after confirmation.
- Cut: check one saved Polygon Feature, sketch a LineString across it, then confirm. The original Feature retains the larger output and a second Feature is created for the other output.
- Merge: check two or more saved Polygon Features, then confirm. The first checked Feature is retained; its attributes remain and the other checked Features are removed.

Tools that do not match the active Project geometry type are disabled. Cut and merge are available only for Polygon Projects. They are disabled while no valid saved-Feature selection exists.

Selection can be made from the saved-data table or directly from the map. The dock highlights Select while map selection is active and changes the map cursor to a pointer. Delete, Cut, and Merge read the same parent workspace selection state, so they remain consistent regardless of where the Feature was selected.

Selected Features receive a red map highlight, and the dock displays the selected count. The map resolves a Feature ID from validated object properties, exact geometry matching, or its source-data index before updating the workspace selection. The first selected Feature remains the Merge target.

## Input flow

1. Select a Project and choose **Tambah** or an enabled drawing tool.
2. Draw the supported geometry. After completing it, use **Select** to adjust vertices if needed.
3. Choose **Selesai** to open the existing attribute form.
4. Submit the form to create the Feature through the existing Project API.

The drawing tools only control an unsaved draft. Cut and merge are the exception: both send the confirmed operation to TileServer, which validates topology, project geofence, attachment safety, and idempotency before saving it.
