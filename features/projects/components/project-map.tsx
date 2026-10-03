"use client";

import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "deck.gl";
import { layerFactory } from "@muhamadanjar/layers/layer-factory";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { TerraDraw, TerraDrawLineStringMode, TerraDrawPointMode, TerraDrawPolygonMode, TerraDrawRectangleMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { projectGeoJsonUrl } from "../api/projects-api";
import type { FeatureGeometry, GeometryType, Position, Project } from "../types";
import { MapEditingToolbar, type MapEditorMode } from "./map-editing-toolbar";
import { MapNavigationControls } from "./map-navigation-controls";

const DEFAULT_VIEW = { center: [107.6191, -6.9175] as Position, zoom: 8.2 };

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type ProjectMapProps = {
  project: Project | null;
  featureRevision: number;
  drawing: boolean;
  /** Overrides the project's geometry type while drawing, so the geofence fence is always a polygon. */
  drawGeometryType?: GeometryType | null;
  draftGeometry: FeatureGeometry | null;
  geofenceGeometry?: FeatureGeometry | null;
  focusGeometry: FeatureGeometry | null;
  workspaceGeometries: FeatureGeometry[];
  projectFeatures: { id: string; geometry: FeatureGeometry }[];
  selectedFeatureGeometries: FeatureGeometry[];
  onCoordinate: (coordinate: Position) => void;
  editorSession: number;
  editorMode: MapEditorMode | null;
  onDraftGeometryChange: (geometry: FeatureGeometry | null) => void;
  onEditorModeChange: (mode: MapEditorMode) => void;
  featureSelectionMode: boolean;
  selectedFeatureCount: number;
  onFeatureSelectionModeChange: (active: boolean) => void;
  onProjectFeatureSelect: (featureId: string | null, additive: boolean) => void;
  tableOpen: boolean;
  onTableToggle: () => void;
  canDelete: boolean;
  onDelete: () => void;
  canCut: boolean;
  canMerge: boolean;
  onCut: () => void;
  onMerge: () => void;
};

function asFeatureGeometry(geometry: GeoJSON.Geometry): FeatureGeometry | null {
  if (geometry.type === "Point") return { type: "Point", coordinates: geometry.coordinates as Position };
  if (geometry.type === "LineString") return { type: "LineString", coordinates: geometry.coordinates as Position[] };
  if (geometry.type === "Polygon") return { type: "Polygon", coordinates: geometry.coordinates as Position[][] };
  return null;
}

function geometryToCollection(geometry: FeatureGeometry | null): GeoJSON.FeatureCollection {
  return geometriesToCollection(geometry ? [geometry] : []);
}

function geometriesToCollection(geometries: FeatureGeometry[]): GeoJSON.FeatureCollection {
  if (!geometries.length) return EMPTY_COLLECTION;
  return {
    type: "FeatureCollection",
    features: geometries.map((geometry) => ({ type: "Feature", properties: {}, geometry })),
  } as GeoJSON.FeatureCollection;
}

function positionsFromGeometry(geometry: FeatureGeometry): Position[] {
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "LineString") return geometry.coordinates;
  return geometry.coordinates.flat();
}

function boundsForGeometries(geometries: FeatureGeometry[]): maplibregl.LngLatBounds | null {
  const coordinates = geometries.flatMap(positionsFromGeometry);
  if (!coordinates.length) return null;
  return coordinates.reduce(
    (bounds, coordinate) => bounds.extend(coordinate),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );
}

function projectLayer(project: Project, revision: number): Layer | null {
  return layerFactory.createLayer({
    layer_id: project.id,
    layer_type: "geojson",
    filename: project.name,
    file_type: "vector",
    tile_url: projectGeoJsonUrl(project.id, revision),
    visible: true,
    opacity: 1,
    file_metadata: {
      style: {
        Point: { fillColor: [15, 107, 95], strokeColor: [255, 255, 255], pointRadius: 7, opacity: 1 },
        LineString: { strokeColor: [15, 107, 95], strokeWidth: 3, opacity: 0.9 },
        Polygon: { fillColor: [103, 162, 197], strokeColor: [15, 107, 95], strokeWidth: 2, opacity: 0.42 },
      },
    },
  }) as Layer | null;
}

function featureIdFromPick(
  info: { object?: unknown; index?: number },
  projectFeatures: { id: string; geometry: FeatureGeometry }[],
): string | null {
  const feature = info.object as { id?: unknown; geometry?: unknown; properties?: { id?: unknown; _id?: unknown } } | undefined;
  const validIds = new Set(projectFeatures.map((item) => item.id));
  const candidateIds = [feature?.id, feature?.properties?.id, feature?.properties?._id]
    .map((value) => typeof value === "number" ? String(value) : value)
    .filter((value): value is string => typeof value === "string" && validIds.has(value));
  let featureId: string | undefined = candidateIds[0];

  if (!featureId && feature?.geometry) {
    const geometrySnapshot = JSON.stringify(feature.geometry);
    featureId = projectFeatures.find((item) => JSON.stringify(item.geometry) === geometrySnapshot)?.id;
  }
  if (!featureId && typeof info.index === "number") {
    featureId = projectFeatures[info.index]?.id;
  }
  return featureId ?? null;
}

export function ProjectMap({
  project,
  featureRevision,
  drawing,
  drawGeometryType = null,
  draftGeometry,
  geofenceGeometry = null,
  focusGeometry,
  workspaceGeometries,
  projectFeatures,
  selectedFeatureGeometries,
  onCoordinate,
  editorSession,
  editorMode,
  onDraftGeometryChange,
  onEditorModeChange,
  featureSelectionMode,
  selectedFeatureCount,
  onFeatureSelectionModeChange,
  onProjectFeatureSelect,
  tableOpen,
  onTableToggle,
  canDelete,
  onDelete,
  canCut,
  canMerge,
  onCut,
  onMerge,
}: ProjectMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const onCoordinateRef = useRef(onCoordinate);
  const drawingRef = useRef(drawing);
  const geometryTypeRef = useRef<GeometryType | null>(project?.geometry_type ?? null);
  const drawGeometryTypeRef = useRef<GeometryType | null>(drawGeometryType);
  const draftGeometryRef = useRef(draftGeometry);
  const geofenceRef = useRef(geofenceGeometry);
  const projectFeaturesRef = useRef(projectFeatures);
  const selectedFeatureGeometriesRef = useRef(selectedFeatureGeometries);
  const editorModeRef = useRef<MapEditorMode | null>(editorMode);
  const featureSelectionModeRef = useRef(featureSelectionMode);
  const shiftKeyPressedRef = useRef(false);
  const onDraftGeometryChangeRef = useRef(onDraftGeometryChange);
  const onEditorModeChangeRef = useRef(onEditorModeChange);
  const onProjectFeatureSelectRef = useRef(onProjectFeatureSelect);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    onCoordinateRef.current = onCoordinate;
    drawingRef.current = drawing;
    geometryTypeRef.current = project?.geometry_type ?? null;
    drawGeometryTypeRef.current = drawGeometryType;
    editorModeRef.current = editorMode;
    featureSelectionModeRef.current = featureSelectionMode;
    const map = mapRef.current;
    if (map) {
      if (featureSelectionMode) map.boxZoom.disable();
      else map.boxZoom.enable();
    }
    onDraftGeometryChangeRef.current = onDraftGeometryChange;
    onEditorModeChangeRef.current = onEditorModeChange;
    onProjectFeatureSelectRef.current = onProjectFeatureSelect;
    projectFeaturesRef.current = projectFeatures;
  }, [drawing, drawGeometryType, editorMode, featureSelectionMode, onCoordinate, onDraftGeometryChange, onEditorModeChange, onProjectFeatureSelect, project?.geometry_type, projectFeatures]);

  useEffect(() => {
    draftGeometryRef.current = draftGeometry;
  }, [draftGeometry]);

  useEffect(() => {
    geofenceRef.current = geofenceGeometry;
  }, [geofenceGeometry]);

  useEffect(() => {
    selectedFeatureGeometriesRef.current = selectedFeatureGeometries;
  }, [selectedFeatureGeometries]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
    });
    if (featureSelectionModeRef.current) map.boxZoom.disable();

    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);
    const mapCanvas = map.getCanvas();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftKeyPressedRef.current = true;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftKeyPressedRef.current = false;
    };
    const handleWindowBlur = () => {
      shiftKeyPressedRef.current = false;
    };
    const handleFeatureSelectionClick = (event: MouseEvent) => {
      if (!featureSelectionModeRef.current || drawingRef.current || !map.isStyleLoaded()) return;
      const bounds = mapCanvas.getBoundingClientRect();
      const picked = overlay.pickObject({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        radius: 4,
      });
      const featureId = picked?.object ? featureIdFromPick(picked, projectFeaturesRef.current) : null;
      onProjectFeatureSelectRef.current(featureId, event.shiftKey || shiftKeyPressedRef.current);
    };
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleWindowBlur);
    mapCanvas.addEventListener("click", handleFeatureSelectionClick, true);

    map.on("load", () => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPointMode(),
          new TerraDrawLineStringMode(),
          new TerraDrawPolygonMode(),
          new TerraDrawRectangleMode(),
          new TerraDrawSelectMode(),
        ],
      });
      const syncDraft = () => {
        const draft = draw.getSnapshot().at(-1);
        onDraftGeometryChangeRef.current(draft ? asFeatureGeometry(draft.geometry) : null);
        setCanUndo(draw.canUndo());
        setCanRedo(draw.canRedo());
      };
      draw.on("change", syncDraft);
      draw.on("history", syncDraft);
      draw.on("finish", () => {
        syncDraft();
        if (editorModeRef.current && draw.getSnapshot().length) {
          draw.setMode("select");
          onEditorModeChangeRef.current("select");
        }
      });
      draw.start();
      draw.setMode(editorModeRef.current ?? "select");
      drawRef.current = draw;

      map.addSource("project-draft", { type: "geojson", data: EMPTY_COLLECTION });
      map.addLayer({
        id: "project-draft-fill",
        type: "fill",
        source: "project-draft",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#67a2c5", "fill-opacity": 0.26 },
      });
      map.addLayer({
        id: "project-draft-line",
        type: "line",
        source: "project-draft",
        filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "Polygon"]],
        paint: { "line-color": "#0f6b5f", "line-width": 3, "line-dasharray": [2, 1] },
      });
      map.addLayer({
        id: "project-draft-points",
        type: "circle",
        source: "project-draft",
        paint: {
          "circle-radius": 5,
          "circle-color": "#0f6b5f",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      (map.getSource("project-draft") as GeoJSONSource).setData(geometryToCollection(draftGeometryRef.current));
      map.addSource("project-geofence", { type: "geojson", data: geometryToCollection(geofenceRef.current) });
      map.addLayer({
        id: "project-geofence-fill",
        type: "fill",
        source: "project-geofence",
        paint: { "fill-color": "#67a2c5", "fill-opacity": 0.14 },
      });
      map.addLayer({
        id: "project-geofence-line",
        type: "line",
        source: "project-geofence",
        paint: { "line-color": "#67a2c5", "line-width": 2, "line-dasharray": [3, 2] },
      });
      map.addSource("project-selection", { type: "geojson", data: geometriesToCollection(selectedFeatureGeometriesRef.current) });
      map.addLayer({
        id: "project-selection-fill",
        type: "fill",
        source: "project-selection",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#c0392b", "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: "project-selection-line",
        type: "line",
        source: "project-selection",
        filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "Polygon"]],
        paint: { "line-color": "#c0392b", "line-width": 4 },
      });
      map.addLayer({
        id: "project-selection-points",
        type: "circle",
        source: "project-selection",
        filter: ["==", ["geometry-type"], "Point"],
        paint: { "circle-radius": 9, "circle-color": "#c0392b", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
      });
      map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : featureSelectionModeRef.current ? "pointer" : "";
    });

    map.on("click", (event) => {
      if (!drawingRef.current) return;
      if (!drawGeometryTypeRef.current && !geometryTypeRef.current) return;
      onCoordinateRef.current([event.lngLat.lng, event.lngLat.lat]);
    });

    mapRef.current = map;
    overlayRef.current = overlay;

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleWindowBlur);
      mapCanvas.removeEventListener("click", handleFeatureSelectionClick, true);
      map.boxZoom.enable();
      drawRef.current?.stop();
      drawRef.current = null;
      overlayRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw || !editorMode) return;
    draw.setMode(editorMode);
  }, [editorMode]);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.clear();
    setCanUndo(false);
    setCanRedo(false);
  }, [editorSession]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const layer = project ? projectLayer(project, featureRevision) : null;
    overlay.setProps({ layers: layer ? [layer] : [] });
  }, [featureRevision, project]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("project-draft") as GeoJSONSource | undefined;
    source?.setData(geometryToCollection(draftGeometry));
    (map.getSource("project-geofence") as GeoJSONSource | undefined)?.setData(geometryToCollection(geofenceGeometry));
    (map.getSource("project-selection") as GeoJSONSource | undefined)?.setData(geometriesToCollection(selectedFeatureGeometries));
    map.getCanvas().style.cursor = drawing ? "crosshair" : featureSelectionMode ? "pointer" : "";
  }, [draftGeometry, drawing, featureSelectionMode, geofenceGeometry, selectedFeatureGeometries]);

  useEffect(() => {
    if (!focusGeometry || !mapRef.current) return;
    const coordinates = positionsFromGeometry(focusGeometry);
    if (!coordinates.length) return;
    const bounds = coordinates.reduce(
      (next, coordinate) => next.extend(coordinate),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
    );
    mapRef.current.fitBounds(bounds, { padding: 96, duration: 550, maxZoom: 16 });
  }, [focusGeometry]);

  const focusWorkspace = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = boundsForGeometries(
      workspaceGeometries.length > 0 ? workspaceGeometries : geofenceGeometry ? [geofenceGeometry] : [],
    );
    if (!bounds) {
      map.flyTo({ center: DEFAULT_VIEW.center, zoom: DEFAULT_VIEW.zoom, bearing: 0, pitch: 0, duration: 550 });
      return;
    }
    map.fitBounds(bounds, { padding: { top: 132, right: 92, bottom: 116, left: 92 }, duration: 550, maxZoom: 16 });
  };

  const clearEditorDraft = () => {
    drawRef.current?.clear();
    onDraftGeometryChangeRef.current(null);
    setCanUndo(false);
    setCanRedo(false);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="Peta OpenStreetMap untuk input Project" />
      <MapNavigationControls
        onZoomIn={() => mapRef.current?.zoomIn({ duration: 180 })}
        onZoomOut={() => mapRef.current?.zoomOut({ duration: 180 })}
        onResetNorth={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 180 })}
        onFocusWorkspace={focusWorkspace}
      />
      {project ? (
        <MapEditingToolbar
          geometryType={project.geometry_type}
          activeMode={editorMode}
          hasDraft={Boolean(draftGeometry)}
          canUndo={canUndo}
          canRedo={canRedo}
          onModeChange={onEditorModeChange}
          onUndo={() => {
            drawRef.current?.undo();
            setCanUndo(drawRef.current?.canUndo() ?? false);
            setCanRedo(drawRef.current?.canRedo() ?? false);
          }}
          onRedo={() => {
            drawRef.current?.redo();
            setCanUndo(drawRef.current?.canUndo() ?? false);
            setCanRedo(drawRef.current?.canRedo() ?? false);
          }}
          onClear={clearEditorDraft}
          featureSelectionMode={featureSelectionMode}
          selectedFeatureCount={selectedFeatureCount}
          onFeatureSelectionModeChange={onFeatureSelectionModeChange}
          tableOpen={tableOpen}
          onTableToggle={onTableToggle}
          canDelete={canDelete}
          onDelete={onDelete}
          canCut={canCut}
          canMerge={canMerge}
          onCut={onCut}
          onMerge={onMerge}
        />
      ) : null}
    </div>
  );
}
