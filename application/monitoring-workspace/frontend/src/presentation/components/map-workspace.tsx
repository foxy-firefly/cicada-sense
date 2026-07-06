import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Feature, Polygon } from "geojson";
import { Layers3, LocateFixed, RotateCcw } from "lucide-react";
import maplibregl, { LngLatBounds, type Map as MapLibreMap, NavigationControl, ScaleControl } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerVisibility } from "../../application/use-dashboard.js";
import { WorkspaceViewModel } from "../../application/workspace-view-model.js";
import type {
  AlertZone,
  Detection,
  HabitatReading,
  ObservationPoint,
  Sensor,
  Site,
  TerritoryBoundary,
} from "../../domain/model.js";
import type { ResolvedTheme } from "../../domain/theme-preference.js";
import { messages } from "../messages.js";
import type { MapBaseStyle } from "./layer-controls.js";

interface MapWorkspaceProps {
  readonly alertZones?: readonly AlertZone[];
  readonly baseMapStyle?: MapBaseStyle;
  readonly detections?: readonly Detection[];
  readonly habitatReadings?: readonly HabitatReading[];
  readonly layerVisibility: LayerVisibility;
  readonly observations?: readonly ObservationPoint[];
  readonly resolvedTheme?: ResolvedTheme;
  readonly sensors: readonly Sensor[];
  readonly sites: readonly Site[];
  readonly selectedSiteId: string | null;
  readonly territories?: readonly TerritoryBoundary[];
  readonly onSelectSite: (siteId: string) => void;
}

const VISIBLE_LAYERS: Array<{ readonly key: keyof LayerVisibility; readonly label: string }> = [
  { key: "acoustic", label: "Acoustic" },
  { key: "species", label: "Emergence" },
  { key: "microclimate", label: "Temperature" },
  { key: "habitat", label: "Habitat" },
  { key: "observations", label: "Observations" },
];

const MAP_STYLE_URLS: Record<MapBaseStyle, string> = {
  "dark-relief": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "light-relief": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  "satellite-compatible": "https://tiles.openfreemap.org/styles/bright",
  topographic: "https://tiles.openfreemap.org/styles/liberty",
};

const LEGEND_STATIONS = [
  { className: "map-legend__dot--active", label: messages.sourceFreshnessActive },
  { className: "map-legend__dot--warning", label: messages.mapStatusWarning },
  { className: "map-legend__dot--offline", label: messages.mapStatusOffline },
  { className: "map-legend__dot--observation", label: messages.mapLegendObservation },
] as const;

const DEFAULT_MAP_CENTER: [number, number] = [-88.1367, 42.1549];

function describeSensorStatus(
  status: ReturnType<typeof WorkspaceViewModel.buildSensorMarkers>[number]["status"],
): string {
  switch (status) {
    case "active":
      return messages.sourceFreshnessActive;
    case "stale":
      return messages.sourceFreshnessStale;
    case "offline":
      return messages.mapStatusOffline;
    case "warning":
      return messages.mapStatusWarning;
  }
}

function isReducedMotionPreferred(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function polygonFeature(
  points: readonly { readonly latitude: number; readonly longitude: number }[],
  id: string,
): Feature<Polygon, { id: string }> {
  const ring = [
    ...points.map((point) => [point.longitude, point.latitude]),
    [points[0]?.longitude ?? 0, points[0]?.latitude ?? 0],
  ];

  return {
    geometry: { coordinates: [ring], type: "Polygon" },
    properties: { id },
    type: "Feature",
  };
}

function deriveBounds(sites: readonly Site[], territories: readonly TerritoryBoundary[]): LngLatBounds | null {
  const coordinates =
    territories.length > 0
      ? territories.flatMap((territory) => territory.coordinates)
      : sites.map((site) => site.coordinates);
  const firstCoordinate = coordinates[0];

  if (!firstCoordinate) {
    return null;
  }

  const bounds = new LngLatBounds(
    [firstCoordinate.longitude, firstCoordinate.latitude],
    [firstCoordinate.longitude, firstCoordinate.latitude],
  );

  for (const coordinate of coordinates.slice(1)) {
    bounds.extend([coordinate.longitude, coordinate.latitude]);
  }

  return bounds;
}

function projectSensorMarkers(
  map: MapLibreMap,
  sensors: readonly Sensor[],
  sites: readonly Site[],
  selectedSiteId: string | null,
): ReturnType<typeof WorkspaceViewModel.buildSensorMarkers> {
  const container = map.getContainer();
  const containerWidth = Math.max(container.clientWidth, 1);
  const containerHeight = Math.max(container.clientHeight, 1);
  const markers = WorkspaceViewModel.buildSensorMarkers(sensors, sites, selectedSiteId);

  return markers.map((marker) => {
    const sensor = sensors.find((currentSensor) => currentSensor.id === marker.id);
    if (!sensor) {
      return marker;
    }

    const projectedPoint = map.project([sensor.coordinates.longitude, sensor.coordinates.latitude]);

    return {
      ...marker,
      leftPercent: (projectedPoint.x / containerWidth) * 100,
      topPercent: (projectedPoint.y / containerHeight) * 100,
    };
  });
}

export function MapWorkspace({
  alertZones = [],
  baseMapStyle = "dark-relief",
  detections = [],
  habitatReadings = [],
  layerVisibility,
  observations = [],
  onSelectSite,
  resolvedTheme = "dark",
  selectedSiteId,
  sensors,
  sites,
  territories = [],
}: MapWorkspaceProps) {
  const visibleLayerKeys = WorkspaceViewModel.visibleLayerKeys(layerVisibility);
  const visibleLayers = VISIBLE_LAYERS.filter((layer) => visibleLayerKeys.includes(layer.key));
  const selectedSite = WorkspaceViewModel.selectedSite(sites, selectedSiteId);
  const fallbackMarkers = useMemo(
    () => WorkspaceViewModel.buildSensorMarkers(sensors, sites, selectedSiteId),
    [selectedSiteId, sensors, sites],
  );
  const styleUrl = MAP_STYLE_URLS[baseMapStyle];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const appliedStyleUrlRef = useRef<string>(styleUrl);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);
  const [displayMarkers, setDisplayMarkers] = useState(fallbackMarkers);
  const bounds = useMemo(() => deriveBounds(sites, territories), [sites, territories]);

  useEffect(() => {
    if (isReducedMotionPreferred()) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setPulseTick((currentValue) => currentValue + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setDisplayMarkers(fallbackMarkers);
  }, [fallbackMarkers]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) {
      return undefined;
    }

    try {
      const map = new maplibregl.Map({
        bearing: 16,
        center: DEFAULT_MAP_CENTER,
        container,
        pitch: 38,
        style: appliedStyleUrlRef.current,
        zoom: 8.6,
      });

      map.addControl(new NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), "top-left");
      map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");

      const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
      map.addControl(overlay as never);

      mapRef.current = map;
      overlayRef.current = overlay;

      const syncMarkersToMap = () => {
        setDisplayMarkers(projectSensorMarkers(map, sensors, sites, selectedSiteId));
      };

      const handleLoad = () => {
        setMapLoaded(true);
        setMapError(false);
        syncMarkersToMap();
      };
      const handleError = () => setMapError(true);

      map.on("load", handleLoad);
      map.on("styledata", handleLoad);
      map.on("error", handleError);
      map.on("render", syncMarkersToMap);
      map.on("resize", syncMarkersToMap);

      return () => {
        map.off("load", handleLoad);
        map.off("styledata", handleLoad);
        map.off("error", handleError);
        map.off("render", syncMarkersToMap);
        map.off("resize", syncMarkersToMap);
        overlay.finalize();
        overlayRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setMapError(true);
      return undefined;
    }
  }, [selectedSiteId, sensors, sites]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = mapRef.current;
    if (appliedStyleUrlRef.current === styleUrl) {
      return;
    }

    setMapLoaded(false);
    appliedStyleUrlRef.current = styleUrl;
    map.setStyle(styleUrl);
  }, [styleUrl]);

  useEffect(() => {
    if (!mapRef.current || !bounds || !mapLoaded) {
      return;
    }

    mapRef.current.fitBounds(bounds, { animate: !isReducedMotionPreferred(), padding: 72 });
  }, [bounds, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    setDisplayMarkers(projectSensorMarkers(mapRef.current, sensors, sites, selectedSiteId));
  }, [selectedSiteId, sensors, sites]);

  useEffect(() => {
    if (!overlayRef.current) {
      return;
    }

    const activeSensors = sensors.filter((sensor) => sensor.status === "active");
    const warningSensors = sensors.filter(
      (sensor) => sensor.status === "stale" || sensor.status === "cooldown" || sensor.status === "error",
    );
    const offlineSensors = sensors.filter((sensor) => sensor.status === "disabled");
    const intensityBySensor = new Map(detections.map((detection) => [detection.sensorId, detection.intensity]));
    const acousticPulse = 1 + ((pulseTick % 5) / 5) * 0.85;
    const themeColors =
      resolvedTheme === "dark"
        ? {
            alertFill: [247, 171, 79, 84] as [number, number, number, number],
            alertStroke: [247, 171, 79, 220] as [number, number, number, number],
            habitat: [82, 169, 118, 92] as [number, number, number, number],
            observation: [104, 183, 255, 176] as [number, number, number, number],
            offline: [150, 159, 168, 220] as [number, number, number, number],
            ring: [224, 192, 84, 170] as [number, number, number, number],
            sensor: [232, 197, 86, 245] as [number, number, number, number],
            territoryFill: [37, 57, 46, 34] as [number, number, number, number],
            territoryLine: [127, 173, 145, 220] as [number, number, number, number],
            warning: [255, 174, 92, 235] as [number, number, number, number],
          }
        : {
            alertFill: [231, 132, 67, 72] as [number, number, number, number],
            alertStroke: [217, 130, 43, 220] as [number, number, number, number],
            habitat: [93, 155, 104, 84] as [number, number, number, number],
            observation: [55, 118, 216, 170] as [number, number, number, number],
            offline: [147, 159, 154, 220] as [number, number, number, number],
            ring: [211, 160, 65, 150] as [number, number, number, number],
            sensor: [211, 160, 65, 235] as [number, number, number, number],
            territoryFill: [119, 164, 122, 20] as [number, number, number, number],
            territoryLine: [68, 103, 76, 200] as [number, number, number, number],
            warning: [217, 130, 43, 235] as [number, number, number, number],
          };

    const layers: Array<GeoJsonLayer | ScatterplotLayer | HeatmapLayer> = [
      new GeoJsonLayer({
        data: territories.map((territory) => polygonFeature(territory.coordinates, territory.id)),
        filled: true,
        getFillColor: themeColors.territoryFill,
        getLineColor: themeColors.territoryLine,
        getLineWidth: 2,
        id: "territory-boundary-layer",
        lineWidthUnits: "pixels",
        stroked: true,
      }),
      new GeoJsonLayer({
        data: alertZones.map((zone) => polygonFeature(zone.coordinates, zone.id)),
        filled: true,
        getFillColor: themeColors.alertFill,
        getLineColor: themeColors.alertStroke,
        getLineWidth: 2,
        id: "alert-zone-layer",
        lineWidthUnits: "pixels",
        stroked: true,
      }),
    ];

    if (layerVisibility.habitat) {
      layers.push(
        new ScatterplotLayer({
          data: habitatReadings,
          getFillColor: (reading: HabitatReading) =>
            [
              themeColors.habitat[0],
              themeColors.habitat[1],
              themeColors.habitat[2],
              Math.min(190, 54 + reading.vegetationHealth),
            ] as [number, number, number, number],
          getPosition: (reading: HabitatReading) => [reading.coordinates.longitude, reading.coordinates.latitude],
          getRadius: (reading: HabitatReading) => 84 + reading.vegetationHealth * 2,
          id: "habitat-quality-layer",
          opacity: 0.2,
          pickable: false,
          radiusUnits: "meters",
        }),
      );
    }

    if (layerVisibility.species) {
      layers.push(
        new HeatmapLayer({
          data: observations,
          getPosition: (observation: ObservationPoint) => [
            observation.coordinates.longitude,
            observation.coordinates.latitude,
          ],
          getWeight: (observation: ObservationPoint) => observation.intensity / 100,
          id: "emergence-probability-layer",
          intensity: 1.15,
          radiusPixels: 44,
          threshold: 0.07,
        }),
      );
    }

    if (layerVisibility.observations) {
      layers.push(
        new ScatterplotLayer({
          data: observations,
          getFillColor: themeColors.observation,
          getPosition: (observation: ObservationPoint) => [
            observation.coordinates.longitude,
            observation.coordinates.latitude,
          ],
          getRadius: 42,
          id: "observation-point-layer",
          opacity: 0.9,
          radiusUnits: "meters",
        }),
      );
    }

    if (layerVisibility.acoustic) {
      layers.push(
        new ScatterplotLayer({
          data: activeSensors,
          getFillColor: [0, 0, 0, 0],
          getLineColor: themeColors.ring,
          getLineWidth: 2,
          getPosition: (sensor: Sensor) => [sensor.coordinates.longitude, sensor.coordinates.latitude],
          getRadius: (sensor: Sensor) => (intensityBySensor.get(sensor.id) ?? 62) * 24 * acousticPulse,
          id: "acoustic-ring-layer-outer",
          lineWidthUnits: "pixels",
          radiusUnits: "meters",
          stroked: true,
        }),
        new ScatterplotLayer({
          data: activeSensors,
          getFillColor: [0, 0, 0, 0],
          getLineColor: [themeColors.ring[0], themeColors.ring[1], themeColors.ring[2], 110] as [
            number,
            number,
            number,
            number,
          ],
          getLineWidth: 2,
          getPosition: (sensor: Sensor) => [sensor.coordinates.longitude, sensor.coordinates.latitude],
          getRadius: (sensor: Sensor) => (intensityBySensor.get(sensor.id) ?? 62) * 16 * acousticPulse,
          id: "acoustic-ring-layer-inner",
          lineWidthUnits: "pixels",
          radiusUnits: "meters",
          stroked: true,
        }),
      );
    }

    if (layerVisibility.sensorHealth) {
      layers.push(
        new ScatterplotLayer({
          data: activeSensors,
          getFillColor: themeColors.sensor,
          getPosition: (sensor: Sensor) => [sensor.coordinates.longitude, sensor.coordinates.latitude],
          getRadius: 118,
          id: "sensor-station-layer-active",
          radiusUnits: "meters",
          stroked: true,
        }),
        new ScatterplotLayer({
          data: warningSensors,
          getFillColor: themeColors.warning,
          getPosition: (sensor: Sensor) => [sensor.coordinates.longitude, sensor.coordinates.latitude],
          getRadius: 118,
          id: "sensor-station-layer-warning",
          radiusUnits: "meters",
          stroked: true,
        }),
        new ScatterplotLayer({
          data: offlineSensors,
          getFillColor: themeColors.offline,
          getPosition: (sensor: Sensor) => [sensor.coordinates.longitude, sensor.coordinates.latitude],
          getRadius: 112,
          id: "sensor-station-layer-offline",
          radiusUnits: "meters",
          stroked: true,
        }),
      );
    }

    overlayRef.current.setProps({ layers });
  }, [
    alertZones,
    detections,
    habitatReadings,
    layerVisibility,
    observations,
    pulseTick,
    resolvedTheme,
    sensors,
    territories,
  ]);

  function fitTerritory() {
    if (!mapRef.current || !bounds) {
      return;
    }

    mapRef.current.fitBounds(bounds, { animate: !isReducedMotionPreferred(), padding: 72 });
  }

  function resetBearing() {
    mapRef.current?.easeTo({ bearing: 0, duration: isReducedMotionPreferred() ? 0 : 550, pitch: 0 });
  }

  function focusLayerTools() {
    document.querySelector(".dashboard-operations-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="map-workspace" aria-label={messages.mapWorkspace}>
      <div className="map-workspace__surface" ref={mapContainerRef} />
      {!mapLoaded && !mapError ? <div className="map-workspace__status">{messages.mapLoading}</div> : null}
      {mapError ? (
        <div className="map-workspace__status map-workspace__status--error">{messages.mapLoadError}</div>
      ) : null}
      <section className="map-focus-card" aria-label={messages.mapFocus}>
        <p className="map-focus-card__eyebrow">{messages.mapFocus}</p>
        <h2>{selectedSite?.name ?? messages.noSite}</h2>
        <dl>
          <div>
            <dt>{messages.mapHabitatScore}</dt>
            <dd>{selectedSite ? selectedSite.habitatScore : "--"}</dd>
          </div>
          <div>
            <dt>{messages.mapCoordinates}</dt>
            <dd>{WorkspaceViewModel.formatCoordinates(selectedSite)}</dd>
          </div>
        </dl>
      </section>
      <section aria-label="Visible layers" className="map-layer-badges">
        {visibleLayers.map((layer) => (
          <span className="map-layer-badge" key={layer.key}>
            {layer.label}
          </span>
        ))}
      </section>
      <div className="map-workspace__controls">
        <button aria-label={messages.mapControlResetBearing} onClick={resetBearing} type="button">
          <RotateCcw size={16} />
        </button>
        <button aria-label={messages.mapControlFitTerritory} onClick={fitTerritory} type="button">
          <LocateFixed size={16} />
        </button>
        <button aria-label={messages.mapControlLayerTools} onClick={focusLayerTools} type="button">
          <Layers3 size={16} />
        </button>
      </div>
      <aside aria-label={messages.mapLegend} className="map-legend">
        <div className="map-legend__section">
          <h3>{messages.mapLegendAcoustic}</h3>
          <div className="map-legend__scale map-legend__scale--acoustic">
            <span>{messages.mapLegendLow}</span>
            <div aria-hidden="true" className="map-legend__gradient" />
            <span>{messages.mapLegendHigh}</span>
          </div>
        </div>
        <div className="map-legend__section">
          <h3>{messages.mapLegendEmergence}</h3>
          <div className="map-legend__scale map-legend__scale--emergence">
            <span>{messages.mapLegendLow}</span>
            <div aria-hidden="true" className="map-legend__gradient map-legend__gradient--emergence" />
            <span>{messages.mapLegendHigh}</span>
          </div>
        </div>
        <div className="map-legend__section">
          <h3>{messages.mapLegendStations}</h3>
          <ul className="map-legend__stations">
            {LEGEND_STATIONS.map((item) => (
              <li key={item.label}>
                <span aria-hidden="true" className={`map-legend__dot ${item.className}`} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="map-coordinate-chip">
        <span>{messages.mapCoordinates}</span>
        <strong>{WorkspaceViewModel.formatCoordinateChip(selectedSite)}</strong>
      </div>
      {layerVisibility.sensorHealth
        ? displayMarkers.map((marker) => {
            const sensorStatus = describeSensorStatus(marker.status);
            return (
              <button
                aria-label={marker.label}
                aria-pressed={marker.isSelected}
                className={`sensor-marker sensor-marker--${marker.status} ${marker.isSelected ? "sensor-marker--selected" : ""}`}
                key={marker.id}
                onClick={() => onSelectSite(marker.siteId)}
                style={{ left: `${marker.leftPercent}%`, top: `${marker.topPercent}%` }}
                type="button"
              >
                <span aria-hidden="true" className="sensor-marker__rings">
                  <span className="sensor-marker__pulse sensor-marker__pulse--outer" />
                  <span className="sensor-marker__pulse sensor-marker__pulse--inner" />
                </span>
                <span aria-hidden="true" className="sensor-marker__core" />
                <span className="sensor-marker__label">{marker.label}</span>
                <span className="sensor-marker__status">{sensorStatus}</span>
              </button>
            );
          })
        : null}
    </section>
  );
}
