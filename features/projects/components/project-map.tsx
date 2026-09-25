"use client";

import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "deck.gl";
import { layerFactory } from "@muhamadanjar/layers/layer-factory";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { projectGeoJsonUrl } from "../api/projects-api";
import type { FeatureGeometry, GeometryType, Position, Project } from "../types";
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
  draftGeometry: FeatureGeometry | null;
  focusGeometry: FeatureGeometry | null;
  workspaceGeometries: FeatureGeometry[];
  onCoordinate: (coordinate: Position) => void;
};

function geometryToCollection(geometry: FeatureGeometry | null): GeoJSON.FeatureCollection {
  if (!geometry) return EMPTY_COLLECTION;
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry }],
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

export function ProjectMap({
  project,
  featureRevision,
  drawing,
  draftGeometry,
  focusGeometry,
  workspaceGeometries,
  onCoordinate,
}: ProjectMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const onCoordinateRef = useRef(onCoordinate);
  const drawingRef = useRef(drawing);
  const geometryTypeRef = useRef<GeometryType | null>(project?.geometry_type ?? null);
  const draftGeometryRef = useRef(draftGeometry);

  useEffect(() => {
    onCoordinateRef.current = onCoordinate;
    drawingRef.current = drawing;
    geometryTypeRef.current = project?.geometry_type ?? null;
  }, [drawing, onCoordinate, project?.geometry_type]);

  useEffect(() => {
    draftGeometryRef.current = draftGeometry;
  }, [draftGeometry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
    });

    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);

    map.on("load", () => {
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
      map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "";
    });

    map.on("click", (event) => {
      if (!drawingRef.current || !geometryTypeRef.current) return;
      onCoordinateRef.current([event.lngLat.lng, event.lngLat.lat]);
    });

    mapRef.current = map;
    overlayRef.current = overlay;

    return () => {
      overlayRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

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
    map.getCanvas().style.cursor = drawing ? "crosshair" : "";
  }, [draftGeometry, drawing]);

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
    const bounds = boundsForGeometries(workspaceGeometries);
    if (!bounds) {
      map.flyTo({ center: DEFAULT_VIEW.center, zoom: DEFAULT_VIEW.zoom, bearing: 0, pitch: 0, duration: 550 });
      return;
    }
    map.fitBounds(bounds, { padding: { top: 132, right: 92, bottom: 116, left: 92 }, duration: 550, maxZoom: 16 });
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
    </div>
  );
}
