import type { Alert, Sensor, Site, SourceStatus, WeatherSummary, WorkspaceContext } from "../domain/model.js";
import type { LayerKey, LayerVisibility } from "./use-dashboard.js";

export type SensorStatusKind = "active" | "offline" | "stale" | "warning";

export interface SensorMarkerViewModel {
  readonly id: string;
  readonly isSelected: boolean;
  readonly label: string;
  readonly leftPercent: number;
  readonly siteId: string;
  readonly status: SensorStatusKind;
  readonly topPercent: number;
}

export interface WorkspaceSummary {
  readonly activeAlerts: number;
  readonly dataStreams: number;
  readonly onlineSensors: number;
  readonly observations: number;
  readonly sites: number;
}

export interface WorkspaceChromeSummary {
  readonly humidityPercent: number;
  readonly organizationName: string;
  readonly precipitationMmH: number;
  readonly roleName: string;
  readonly temperatureC: number;
  readonly timestampLabel: string;
  readonly windDirection: string;
  readonly windSpeedKmh: number;
  readonly workspaceName: string;
}

export class WorkspaceViewModel {
  public static buildSensorMarkers(
    sensors: readonly Sensor[],
    sites: readonly Site[],
    selectedSiteId: string | null,
  ): SensorMarkerViewModel[] {
    const latitudes = sensors.map((sensor) => sensor.coordinates.latitude);
    const longitudes = sensors.map((sensor) => sensor.coordinates.longitude);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    const latitudeRange = Math.max(0.001, maxLatitude - minLatitude);
    const longitudeRange = Math.max(0.001, maxLongitude - minLongitude);

    return sensors.map((sensor) => {
      const site = sites.find((currentSite) => currentSite.id === sensor.siteId);
      const longitudeRatio = (sensor.coordinates.longitude - minLongitude) / longitudeRange;
      const latitudeRatio = (sensor.coordinates.latitude - minLatitude) / latitudeRange;

      return {
        id: sensor.id,
        isSelected: selectedSiteId === sensor.siteId,
        label: site?.name ?? sensor.name,
        leftPercent: 12 + longitudeRatio * 76,
        siteId: sensor.siteId,
        status: WorkspaceViewModel.sensorStatus(sensor.status),
        topPercent: 16 + (1 - latitudeRatio) * 62,
      };
    });
  }

  public static buildWorkspaceChromeSummary(
    workspace?: WorkspaceContext,
    weather?: WeatherSummary,
  ): WorkspaceChromeSummary {
    return {
      humidityPercent: weather?.humidity ?? 64,
      organizationName: "Eco Research Lab",
      precipitationMmH: weather?.precipitationMmH ?? 0.2,
      roleName: "Administrator",
      temperatureC: weather?.temperatureC ?? 24.6,
      timestampLabel: WorkspaceViewModel.formatTimestamp(workspace?.timestamp ?? "2025-05-22T14:37:12Z"),
      windDirection: weather?.windDirection ?? "NW",
      windSpeedKmh: weather?.windSpeedKmh ?? 12,
      workspaceName: workspace?.name ?? "Fixture workspace",
    };
  }

  public static buildWorkspaceSummary(
    sites: readonly Site[],
    sensors: readonly Sensor[],
    alerts: readonly Alert[],
    freshnessSummary: Record<SourceStatus, number>,
    observations = 0,
  ): WorkspaceSummary {
    return {
      activeAlerts: alerts.length,
      dataStreams: freshnessSummary.active,
      onlineSensors: sensors.filter((sensor) => sensor.status === "active").length,
      observations,
      sites: sites.length,
    };
  }

  public static formatCoordinates(site: Site | null): string {
    if (!site) {
      return "--";
    }

    return `lat ${site.coordinates.latitude.toFixed(4)}°  lon ${site.coordinates.longitude.toFixed(4)}°`;
  }

  public static formatCoordinateChip(site: Site | null): string {
    if (!site) {
      return "lat --  lon --  elev --";
    }

    return `lat ${site.coordinates.latitude.toFixed(4)}°   lon ${site.coordinates.longitude.toFixed(4)}°   elev ${site.elevationMeters ?? "--"} m`;
  }

  public static formatFreshnessSeconds(seconds: number | undefined): string {
    if (seconds === undefined) {
      return "No data";
    }

    const normalizedSeconds = Math.max(0, seconds);
    const minutes = Math.floor(normalizedSeconds / 60);
    const remainderSeconds = normalizedSeconds % 60;

    return `${minutes}m ${String(remainderSeconds).padStart(2, "0")}s ago`;
  }

  public static formatTimestamp(timestamp: string): string {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      second: "2-digit",
      year: "numeric",
    })
      .format(new Date(timestamp))
      .replace(",", "")
      .replace(/\s(?=\d{2}:\d{2}:\d{2})/, " • ");
  }

  public static selectedSite(sites: readonly Site[], selectedSiteId: string | null): Site | null {
    return sites.find((site) => site.id === selectedSiteId) ?? sites[0] ?? null;
  }

  public static visibleLayerKeys(layerVisibility: LayerVisibility): LayerKey[] {
    return (Object.entries(layerVisibility) as Array<[LayerKey, boolean]>)
      .filter(([, isVisible]) => isVisible)
      .map(([key]) => key);
  }

  private static sensorStatus(status: Sensor["status"]): SensorStatusKind {
    switch (status) {
      case "active":
        return "active";
      case "stale":
        return "stale";
      case "disabled":
        return "offline";
      case "cooldown":
      case "error":
        return "warning";
    }
  }
}
