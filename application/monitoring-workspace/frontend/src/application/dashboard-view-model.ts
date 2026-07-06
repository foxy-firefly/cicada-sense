import type { Alert, Detection, Sensor, Site, SourceHealth, SourceStatus } from "../domain/model.js";

export type SignalAnomalyKind = "alert" | "calm" | "no-data" | "outage" | "stale";
export type FreshnessKind = "active" | "none" | "stale" | "warning";

export interface SignalRailSummary {
  readonly activeDetectionValue: number | null;
  readonly alertsCount: number;
  readonly anomalyKind: SignalAnomalyKind;
  readonly anomalyMessage: string | null;
  readonly confidencePercent: number | null;
  readonly freshnessCount: number;
  readonly freshnessKind: FreshnessKind;
  readonly recentAlerts: readonly Alert[];
}

export interface SiteDetailSummary {
  readonly freshSources: number;
  readonly siteAlerts: readonly Alert[];
  readonly siteDetections: readonly Detection[];
  readonly siteHealth: readonly SourceHealth[];
  readonly siteSensors: readonly Sensor[];
}

export class DashboardViewModel {
  public static summarizeSignalRail(
    detections: readonly Detection[],
    alerts: readonly Alert[],
    freshnessSummary: Record<SourceStatus, number>,
    activeDetectionCount: number,
  ): SignalRailSummary {
    return {
      activeDetectionValue: detections.length === 0 ? null : activeDetectionCount,
      alertsCount: alerts.length,
      anomalyKind: DashboardViewModel.anomalyKind(detections, alerts, freshnessSummary),
      anomalyMessage: DashboardViewModel.anomalyMessage(detections, alerts, freshnessSummary),
      confidencePercent: DashboardViewModel.averageConfidencePercent(detections),
      freshnessCount: DashboardViewModel.freshnessCount(freshnessSummary),
      freshnessKind: DashboardViewModel.freshnessKind(freshnessSummary),
      recentAlerts: alerts.slice(0, 3),
    };
  }

  public static summarizeSiteDetail(
    site: Site,
    sensors: readonly Sensor[],
    detections: readonly Detection[],
    sourceHealth: readonly SourceHealth[],
    alerts: readonly Alert[],
  ): SiteDetailSummary {
    const siteSensors = sensors.filter((sensor) => sensor.siteId === site.id);
    const siteDetections = detections.filter((detection) => detection.siteId === site.id);
    const siteHealth = sourceHealth.filter((source) => source.siteId === site.id);
    const siteAlerts = alerts.filter((alert) => alert.siteId === site.id);

    return {
      freshSources: siteHealth.filter((source) => source.status === "active").length,
      siteAlerts,
      siteDetections,
      siteHealth,
      siteSensors,
    };
  }

  public static averageConfidencePercent(detections: readonly Detection[]): number | null {
    if (detections.length === 0) {
      return null;
    }

    const averageConfidence = detections.reduce((sum, detection) => sum + detection.confidence, 0) / detections.length;
    return Math.round(averageConfidence * 100);
  }

  public static freshnessCount(freshnessSummary: Record<SourceStatus, number>): number {
    if (freshnessSummary.error > 0 || freshnessSummary.cooldown > 0) {
      return freshnessSummary.error + freshnessSummary.cooldown;
    }

    if (freshnessSummary.stale > 0) {
      return freshnessSummary.stale;
    }

    if (freshnessSummary.active > 0) {
      return freshnessSummary.active;
    }

    return 0;
  }

  public static freshnessKind(freshnessSummary: Record<SourceStatus, number>): FreshnessKind {
    if (freshnessSummary.error > 0 || freshnessSummary.cooldown > 0) {
      return "warning";
    }

    if (freshnessSummary.stale > 0) {
      return "stale";
    }

    if (freshnessSummary.active > 0) {
      return "active";
    }

    return "none";
  }

  public static alertSeverityLabel(alert: Alert): string {
    return alert.severity.toUpperCase();
  }

  private static anomalyKind(
    detections: readonly Detection[],
    alerts: readonly Alert[],
    freshnessSummary: Record<SourceStatus, number>,
  ): SignalAnomalyKind {
    const totalFreshnessSignals = Object.values(freshnessSummary).reduce((sum, value) => sum + value, 0);
    if (detections.length === 0 && totalFreshnessSignals === 0 && alerts.length === 0) {
      return "no-data";
    }

    if (freshnessSummary.error > 0 || freshnessSummary.cooldown > 0) {
      return "outage";
    }

    if (freshnessSummary.stale > 0) {
      return "stale";
    }

    if (alerts.length > 0) {
      return "alert";
    }

    return "calm";
  }

  private static anomalyMessage(
    detections: readonly Detection[],
    alerts: readonly Alert[],
    freshnessSummary: Record<SourceStatus, number>,
  ): string | null {
    const kind = DashboardViewModel.anomalyKind(detections, alerts, freshnessSummary);
    if (kind === "alert") {
      return alerts[0]?.message ?? null;
    }

    return null;
  }
}
