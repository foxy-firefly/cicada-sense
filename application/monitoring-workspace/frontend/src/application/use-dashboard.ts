import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  type Alert,
  type DashboardBootstrap,
  DashboardModel,
  type Detection,
  type Site,
  type TimeWindow,
} from "../domain/model.js";
import { DashboardClient } from "../infrastructure/api/dashboard-client.js";
import { DashboardRealtimeClient } from "../infrastructure/realtime/dashboard-realtime-client.js";

const EMPTY_BOOTSTRAP: DashboardBootstrap = {
  alerts: [],
  alertZones: [],
  detections: [],
  habitatReadings: [],
  observations: [],
  sensors: [],
  sites: [],
  sourceHealth: [],
  species: [],
  summary: {
    acousticActivity: 0,
    activeAlerts: 0,
    dataFreshnessSeconds: 0,
    emergenceProbability: 0,
    speciesConfidence: 0,
  },
  territories: [],
  timeline: [],
  weather: {
    humidity: 0,
    precipitationMmH: 0,
    temperatureC: 0,
    windDirection: "--",
    windSpeedKmh: 0,
  },
  workspace: {
    id: "bootstrap-pending",
    mode: "offline",
    name: "Monitoring workspace",
    timestamp: "1970-01-01T00:00:00.000Z",
  },
};

export type LayerKey = "acoustic" | "species" | "microclimate" | "habitat" | "observations" | "sensorHealth";

export interface LayerVisibility {
  readonly acoustic: boolean;
  readonly species: boolean;
  readonly microclimate: boolean;
  readonly habitat: boolean;
  readonly observations: boolean;
  readonly sensorHealth: boolean;
}

const LAYER_STORAGE_KEY = "cicada-sense:layer-visibility";
const FIXED_NOW = import.meta.env.VITE_FIXED_NOW;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  acoustic: true,
  species: true,
  microclimate: true,
  habitat: true,
  observations: true,
  sensorHealth: true,
};

const REALTIME_ENABLED = import.meta.env.VITE_DISABLE_REALTIME !== "1";

function readLayerVisibility(storage: Storage | undefined): LayerVisibility {
  if (!storage) {
    return DEFAULT_LAYER_VISIBILITY;
  }

  const rawValue = storage.getItem(LAYER_STORAGE_KEY);
  if (!rawValue) {
    return DEFAULT_LAYER_VISIBILITY;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<LayerVisibility>;
    return {
      acoustic: parsedValue.acoustic ?? true,
      species: parsedValue.species ?? true,
      microclimate: parsedValue.microclimate ?? true,
      habitat: parsedValue.habitat ?? true,
      observations: parsedValue.observations ?? true,
      sensorHealth: parsedValue.sensorHealth ?? true,
    };
  } catch {
    return DEFAULT_LAYER_VISIBILITY;
  }
}

export function useDashboard(
  client = new DashboardClient(),
  realtimeClient = new DashboardRealtimeClient(),
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  now: () => Date = () => (FIXED_NOW ? new Date(FIXED_NOW) : new Date()),
) {
  const [realtimeData, setRealtimeData] = useState<DashboardBootstrap | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(() => readLayerVisibility(storage));
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");

  const dashboardQuery = useQuery<DashboardBootstrap>({
    queryFn: () => client.getBootstrap(),
    queryKey: ["dashboard-bootstrap"],
  });

  const data = realtimeData ?? dashboardQuery.data ?? EMPTY_BOOTSTRAP;
  const isLoading = dashboardQuery.isPending && !dashboardQuery.data;
  const error = dashboardQuery.error ? "dashboard.errors.bootstrap" : null;

  useEffect(() => {
    if (!dashboardQuery.data) {
      return;
    }

    setRealtimeData(null);
  }, [dashboardQuery.data]);

  useEffect(() => {
    storage?.setItem(LAYER_STORAGE_KEY, JSON.stringify(layerVisibility));
  }, [layerVisibility, storage]);

  useEffect(() => {
    if (selectedSiteId && data.sites.some((site) => site.id === selectedSiteId)) {
      return;
    }

    setSelectedSiteId(data.sites[0]?.id ?? null);
  }, [data.sites, selectedSiteId]);

  useEffect(() => {
    if (!REALTIME_ENABLED) {
      return undefined;
    }

    const firstProjectSensor = data.sensors[0];
    if (!firstProjectSensor) {
      return undefined;
    }

    return realtimeClient.connect(
      "project-provence-2026",
      (detection: Detection) => {
        setRealtimeData((currentData) => {
          const nextData = currentData ?? data;
          if (nextData.detections.some((currentDetection) => currentDetection.id === detection.id)) {
            return nextData;
          }

          return {
            ...nextData,
            detections: [...nextData.detections, detection],
          };
        });
      },
      (alert: Alert) => {
        setRealtimeData((currentData) => {
          const nextData = currentData ?? data;
          if (nextData.alerts.some((currentAlert) => currentAlert.id === alert.id)) {
            return nextData;
          }

          return {
            ...nextData,
            alerts: [...nextData.alerts, alert],
          };
        });
      },
    );
  }, [data, data.sensors, realtimeClient]);

  const selectedSite = useMemo<Site | null>(
    () => data.sites.find((site) => site.id === selectedSiteId) ?? null,
    [data.sites, selectedSiteId],
  );

  const filteredDetections = useMemo(
    () => DashboardModel.filterDetectionsByTimeWindow(data.detections, timeWindow, now()),
    [data.detections, now, timeWindow],
  );

  function setLayerEnabled(layer: LayerKey, isEnabled: boolean) {
    setLayerVisibility((currentVisibility) => ({
      ...currentVisibility,
      [layer]: isEnabled,
    }));
  }

  return {
    activeDetectionCount: DashboardModel.activeDetectionCount(filteredDetections),
    data,
    error,
    filteredDetections,
    freshnessSummary: DashboardModel.freshnessSummary(data.sourceHealth),
    isLoading,
    layerVisibility,
    selectedSite,
    selectedSiteId,
    setLayerEnabled,
    setSelectedSiteId,
    setTimeWindow,
    timeWindow,
  };
}
