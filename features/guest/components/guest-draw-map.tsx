"use client";

import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { MapNavigationControls } from "@/features/projects/components/map-navigation-controls";
import type { FeatureGeometry, GeometryType, Position } from "@/features/projects/types";

const DEFAULT_VIEW = { center: [107.6191, -6.9175] as Position, zoom: 8.2 };
const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

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

type GuestDrawMapProps = {
  geometryType: GeometryType;
  drawing: boolean;
  draftGeometry: FeatureGeometry | null;
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

export function GuestDrawMap({ geometryType, drawing, draftGeometry, onCoordinate }: GuestDrawMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onCoordinateRef = useRef(onCoordinate);
  const drawingRef = useRef(drawing);
  const draftRef = useRef(draftGeometry);

  useEffect(() => {
    onCoordinateRef.current = onCoordinate;
    drawingRef.current = drawing;
  }, [drawing, onCoordinate]);

  useEffect(() => {
    draftRef.current = draftGeometry;
  }, [draftGeometry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const container = containerRef.current;
    const map = new maplibregl.Map({ container, style: OSM_STYLE, center: DEFAULT_VIEW.center, zoom: DEFAULT_VIEW.zoom });
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);
    map.on("load", () => {
      map.addSource("guest-draft", { type: "geojson", data: EMPTY_COLLECTION });
      map.addLayer({ id: "guest-draft-fill", type: "fill", source: "guest-draft", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#67a2c5", "fill-opacity": 0.28 } });
      map.addLayer({ id: "guest-draft-line", type: "line", source: "guest-draft", filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "Polygon"]], paint: { "line-color": "#0f6b5f", "line-width": 3, "line-dasharray": [2, 1] } });
      map.addLayer({ id: "guest-draft-point", type: "circle", source: "guest-draft", paint: { "circle-radius": 6, "circle-color": "#0f6b5f", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
      (map.getSource("guest-draft") as GeoJSONSource).setData(geometryToCollection(draftRef.current));
      map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "";
      map.resize();
    });
    map.on("click", (event) => {
      if (drawingRef.current) onCoordinateRef.current([event.lngLat.lng, event.lngLat.lat]);
    });
    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("guest-draft") as GeoJSONSource | undefined;
    source?.setData(geometryToCollection(draftGeometry));
    map.getCanvas().style.cursor = drawing ? "crosshair" : "";
  }, [draftGeometry, drawing]);

  const focusDraft = () => {
    const map = mapRef.current;
    if (!map || !draftGeometry) {
      map?.flyTo({ center: DEFAULT_VIEW.center, zoom: DEFAULT_VIEW.zoom, bearing: 0, pitch: 0, duration: 400 });
      return;
    }
    const positions = positionsFromGeometry(draftGeometry);
    if (!positions.length) return;
    const bounds = positions.reduce((next, point) => next.extend(point), new maplibregl.LngLatBounds(positions[0], positions[0]));
    map.fitBounds(bounds, { padding: 72, duration: 400, maxZoom: 16 });
  };

  return (
    <div className="relative h-[min(58vh,34rem)] min-h-80 w-full overflow-hidden rounded-2xl border border-black/10 bg-[#e7e4df]">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`Peta untuk menggambar ${geometryType}`} />
      <MapNavigationControls
        onZoomIn={() => mapRef.current?.zoomIn({ duration: 180 })}
        onZoomOut={() => mapRef.current?.zoomOut({ duration: 180 })}
        onResetNorth={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 180 })}
        onFocusWorkspace={focusDraft}
      />
      <p className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-5.5rem)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-[#1c1b19] shadow-sm backdrop-blur">
        {drawing ? "Klik peta untuk menambahkan titik." : `Mode input ${geometryType} siap.`}
      </p>
    </div>
  );
}
