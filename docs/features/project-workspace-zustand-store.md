# Project Workspace state store

**Plan:** [project-workspace-zustand-store.md](../plans/project-workspace-zustand-store.md)  
**Progress:** [project-workspace-zustand-store.md](../progress/project-workspace-zustand-store.md)

`ProjectWorkspace` uses a feature-owned Zustand store for state shared by the workspace, map, feature table, and editing toolbar. The store contains Projects and Features, the active Project, map draft/editing session, map focus, feature selection, and geofence data/drawing points.

The store exposes typed field updates plus explicit project activation and draft reset actions. Activating a Project clears its previous feature, selection, geofence, focus, and editing data. Resetting a draft increments the editor session so Terra Draw clears its in-memory sketch.

Loading/error indicators, form field values, dialogs, notices, and request-in-progress flags stay in `ProjectWorkspace` because they are local presentation or operation state. MapLibre and Terra Draw instances stay in refs; imperative runtime objects are not placed in Zustand.

The store is in-memory only and does not persist data. API calls remain in the Project feature API client and workspace orchestration; the store owns client-side state, not server persistence.
