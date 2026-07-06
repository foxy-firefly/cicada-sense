export type SourceStatus = "active" | "stale" | "cooldown" | "disabled" | "error";
export type TimeWindow = "1h" | "6h" | "24h" | "7d" | "season";

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface WorkspaceContext {
  readonly id: string;
  readonly mode: "demo" | "live" | "offline";
  readonly name: string;
  readonly timestamp: string;
}

export interface WeatherSummary {
  readonly humidity: number;
  readonly precipitationMmH: number;
  readonly temperatureC: number;
  readonly windDirection: string;
  readonly windSpeedKmh: number;
}

export interface DashboardSignalSummary {
  readonly acousticActivity: number;
  readonly activeAlerts: number;
  readonly dataFreshnessSeconds: number;
  readonly emergenceProbability: number;
  readonly speciesConfidence: number;
}

export interface SeasonalWindow {
  readonly end: string;
  readonly start: string;
}

export interface SeasonalProgress {
  readonly currentDay: number;
  readonly totalDays: number;
}

export interface Site {
  readonly broodLabel?: string;
  readonly id: string;
  readonly elevationMeters?: number;
  readonly emergenceWindow?: SeasonalWindow;
  readonly habitatClass?: string;
  readonly name: string;
  readonly coordinates: Coordinates;
  readonly habitatScore: number;
  readonly seasonProgress?: SeasonalProgress;
  readonly territoryId?: string;
}

export interface Sensor {
  readonly id: string;
  readonly siteId: string;
  readonly name: string;
  readonly coordinates: Coordinates;
  readonly status: SourceStatus;
}

export interface Species {
  readonly id: string;
  readonly commonName: string;
  readonly scientificName: string;
}

export interface Detection {
  readonly id: string;
  readonly siteId: string;
  readonly sensorId: string;
  readonly speciesId: string;
  readonly confidence: number;
  readonly intensity: number;
  readonly recordedAt: string;
}

export interface SourceHealth {
  readonly sourceId: string;
  readonly siteId: string;
  readonly status: SourceStatus;
  readonly lastSeenAt: string | null;
}

export interface Alert {
  readonly id: string;
  readonly siteId: string;
  readonly severity: "info" | "warning" | "critical";
  readonly kind: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface TerritoryBoundary {
  readonly coordinates: readonly Coordinates[];
  readonly id: string;
  readonly name: string;
}

export interface ObservationPoint {
  readonly coordinates: Coordinates;
  readonly id: string;
  readonly intensity: number;
  readonly observedAt: string;
  readonly siteId: string;
  readonly speciesLabel: string;
}

export interface HabitatReading {
  readonly coordinates: Coordinates;
  readonly id: string;
  readonly moisturePercent: number;
  readonly siteId: string;
  readonly vegetationHealth: number;
}

export interface TimelinePoint {
  readonly acousticActivity: number;
  readonly alertCount: number;
  readonly emergenceProbability: number;
  readonly id: string;
  readonly observationCount: number;
  readonly timestamp: string;
}

export interface AlertZone {
  readonly coordinates: readonly Coordinates[];
  readonly id: string;
  readonly label: string;
  readonly severity: Alert["severity"];
  readonly siteId: string;
}

export interface DashboardBootstrap {
  readonly alertZones?: readonly AlertZone[];
  readonly sites: readonly Site[];
  readonly sensors: readonly Sensor[];
  readonly species: readonly Species[];
  readonly detections: readonly Detection[];
  readonly sourceHealth: readonly SourceHealth[];
  readonly alerts: readonly Alert[];
  readonly habitatReadings?: readonly HabitatReading[];
  readonly observations?: readonly ObservationPoint[];
  readonly summary?: DashboardSignalSummary;
  readonly timeline?: readonly TimelinePoint[];
  readonly territories?: readonly TerritoryBoundary[];
  readonly weather?: WeatherSummary;
  readonly workspace?: WorkspaceContext;
}

export class DashboardModel {
  public static filterDetectionsByTimeWindow(
    detections: readonly Detection[],
    timeWindow: TimeWindow,
    referenceDate: Date,
  ): Detection[] {
    const minimumTimestamp = referenceDate.getTime() - DashboardModel.windowHours(timeWindow) * 60 * 60 * 1000;
    return detections.filter((detection) => new Date(detection.recordedAt).getTime() >= minimumTimestamp);
  }

  public static activeDetectionCount(detections: readonly Detection[], minimumIntensity = 50): number {
    return detections.filter((detection) => detection.intensity >= minimumIntensity).length;
  }

  public static freshnessSummary(sourceHealth: readonly SourceHealth[]): Record<SourceStatus, number> {
    const summary: Record<SourceStatus, number> = {
      active: 0,
      stale: 0,
      cooldown: 0,
      disabled: 0,
      error: 0,
    };

    for (const source of sourceHealth) {
      summary[source.status] += 1;
    }

    return summary;
  }

  private static windowHours(timeWindow: TimeWindow): number {
    switch (timeWindow) {
      case "1h":
        return 1;
      case "6h":
        return 6;
      case "24h":
        return 24;
      case "7d":
        return 24 * 7;
      case "season":
        return 24 * 90;
    }
  }
}
