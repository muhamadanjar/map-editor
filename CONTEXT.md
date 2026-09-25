# Map Editor

Map Editor is a geospatial editing context in which analysts organize spatial data and editing work by project.

## Language

**Project**:
The selectable unit of map-editing work that owns its feature data, form schema, and exactly one geometry type.
_Avoid_: workspace, map, dataset, layer group

**Active Project**:
The Project explicitly selected by the user as the current input context; no Feature can be drawn or saved before one is selected.
_Avoid_: default project, recent project

**Draft Input**:
An unsaved geometry and its in-progress form values for the Active Project; changing Project requires confirmation before the draft is discarded.
_Avoid_: saved feature, autosave

**Workspace**:
The interactive map editor opened for one active Project, including its map canvas, project layers, and data table.
_Avoid_: project, dashboard

**Feature**:
A single spatial record in a Project, consisting of geometry and attributes defined by that Project's form schema.
_Avoid_: row, marker, shape

**Input Form**:
The Project-specific modal or sheet shown after a valid geometry is drawn, used to create a new Feature by pairing that geometry with attributes; it does not edit or delete existing Features.
_Avoid_: attribute table, feature editor

**Feature Table**:
A read-only, Project-scoped list of saved Features used to verify input and locate a Feature on the map.
_Avoid_: spreadsheet, feature editor

**Basemap**:
The OpenStreetMap reference map rendered beneath the active Project's saved Features and drawing draft.
_Avoid_: project layer, feature layer
