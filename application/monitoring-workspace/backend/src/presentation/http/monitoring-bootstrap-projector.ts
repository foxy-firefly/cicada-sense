import type { Alert, Detection, Sensor, Site, SourceHealth, Species } from "../../domain/model.js";

interface CoreBootstrap {
  readonly alerts: readonly Alert[];
  readonly detections: readonly Detection[];
  readonly organizations: readonly { readonly id: string; readonly name: string }[];
  readonly projects: readonly { readonly id: string; readonly name: string }[];
  readonly sensors: readonly Sensor[];
  readonly sites: readonly Site[];
  readonly sourceHealth: readonly SourceHealth[];
  readonly species: readonly Species[];
}

interface SitePresentationMetadata {
  readonly broodLabel: string;
  readonly eastRadiusKilometers: number;
  readonly elevationMeters: number;
  readonly emergenceWindow: { readonly end: string; readonly start: string };
  readonly habitatClass: string;
  readonly northRadiusKilometers: number;
  readonly seasonProgress: { readonly currentDay: number; readonly totalDays: number };
}

const FIXTURE_WORKSPACE_ID = "project-provence-2026";
const DEFAULT_WORKSPACE_TIMESTAMP = "2026-05-29T10:25:00.000Z";
const SITE_PRESENTATION: Record<string, SitePresentationMetadata> = {
  "site-alpilles-north": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 4.1,
    elevationMeters: 301,
    emergenceWindow: { end: "2026-06-28", start: "2026-04-16" },
    habitatClass: "Terraced olive scrub",
    northRadiusKilometers: 3.2,
    seasonProgress: { currentDay: 39, totalDays: 74 },
  },
  "site-calanques": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 4.6,
    elevationMeters: 127,
    emergenceWindow: { end: "2026-06-18", start: "2026-04-11" },
    habitatClass: "Limestone coastal slope",
    northRadiusKilometers: 2.8,
    seasonProgress: { currentDay: 44, totalDays: 69 },
  },
  "site-camargue-west": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 5.2,
    elevationMeters: 6,
    emergenceWindow: { end: "2026-06-20", start: "2026-04-09" },
    habitatClass: "Marsh reed mosaic",
    northRadiusKilometers: 3.6,
    seasonProgress: { currentDay: 45, totalDays: 73 },
  },
  "site-luberon-east": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 4.9,
    elevationMeters: 412,
    emergenceWindow: { end: "2026-06-24", start: "2026-04-15" },
    habitatClass: "Dry oak grove",
    northRadiusKilometers: 3.7,
    seasonProgress: { currentDay: 37, totalDays: 71 },
  },
  "site-sainte-victoire": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 4.8,
    elevationMeters: 342,
    emergenceWindow: { end: "2026-06-30", start: "2026-04-15" },
    habitatClass: "Pine ridge chorus belt",
    northRadiusKilometers: 3.5,
    seasonProgress: { currentDay: 38, totalDays: 77 },
  },
  "site-verdon-south": {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    eastRadiusKilometers: 5.4,
    elevationMeters: 518,
    emergenceWindow: { end: "2026-06-26", start: "2026-04-17" },
    habitatClass: "Plateau edge woodland",
    northRadiusKilometers: 3.8,
    seasonProgress: { currentDay: 36, totalDays: 70 },
  },
};

const DEFAULT_SITE_PRESENTATION: SitePresentationMetadata = {
  broodLabel: "Brood XIII · 17-Year Cicadas",
  eastRadiusKilometers: 4.8,
  elevationMeters: 342,
  emergenceWindow: { end: "2026-06-30", start: "2026-04-15" },
  habitatClass: "Pine ridge chorus belt",
  northRadiusKilometers: 3.5,
  seasonProgress: { currentDay: 38, totalDays: 77 },
};

function sitePresentationFor(siteId: string): SitePresentationMetadata {
  return SITE_PRESENTATION[siteId] ?? DEFAULT_SITE_PRESENTATION;
}

function offsetCoordinates(
  origin: { readonly latitude: number; readonly longitude: number },
  eastKilometers: number,
  northKilometers: number,
) {
  const latitudeOffset = northKilometers / 111;
  const longitudeOffset = eastKilometers / (111 * Math.cos((origin.latitude * Math.PI) / 180));

  return {
    latitude: Number((origin.latitude + latitudeOffset).toFixed(6)),
    longitude: Number((origin.longitude + longitudeOffset).toFixed(6)),
  };
}

function buildRoundedPolygon(
  center: { readonly latitude: number; readonly longitude: number },
  eastRadiusKilometers: number,
  northRadiusKilometers: number,
  vertices = 8,
) {
  return Array.from({ length: vertices }, (_, index) => {
    const angle = (index / vertices) * Math.PI * 2;
    return offsetCoordinates(center, Math.cos(angle) * eastRadiusKilometers, Math.sin(angle) * northRadiusKilometers);
  });
}

function latestTimestamp(coreBootstrap: CoreBootstrap): string {
  const timestamps = [
    ...coreBootstrap.detections.map((detection) => detection.recordedAt),
    ...coreBootstrap.alerts.map((alert) => alert.createdAt),
    ...coreBootstrap.sourceHealth.flatMap((source) => (source.lastSeenAt ? [source.lastSeenAt] : [])),
  ].sort();

  return timestamps.at(-1) ?? DEFAULT_WORKSPACE_TIMESTAMP;
}

function averageConfidencePercent(detections: readonly Detection[]): number {
  if (detections.length === 0) {
    return 0;
  }

  const totalConfidence = detections.reduce((sum, detection) => sum + detection.confidence, 0);
  return Math.round((totalConfidence / detections.length) * 100);
}

function latestFreshnessSeconds(referenceTimestamp: string, sourceHealth: readonly SourceHealth[]): number {
  const newestTimestamp = sourceHealth
    .flatMap((source) => (source.lastSeenAt ? [source.lastSeenAt] : []))
    .sort()
    .at(-1);

  if (!newestTimestamp) {
    return 0;
  }

  return Math.max(0, Math.round((Date.parse(referenceTimestamp) - Date.parse(newestTimestamp)) / 1000));
}

function timelineFor(coreBootstrap: CoreBootstrap, workspaceTimestamp: string) {
  const endTime = Date.parse(workspaceTimestamp);
  const intervalMs = 30 * 60 * 1000;
  const startTime = endTime - 47 * intervalMs;

  return Array.from({ length: 48 }, (_, index) => {
    const bucketStart = startTime + index * intervalMs;
    const bucketEnd = bucketStart + intervalMs;
    const bucketDetections = coreBootstrap.detections.filter((detection) => {
      const recordedAt = Date.parse(detection.recordedAt);
      return recordedAt >= bucketStart && recordedAt < bucketEnd;
    });
    const bucketAlerts = coreBootstrap.alerts.filter((alert) => {
      const createdAt = Date.parse(alert.createdAt);
      return createdAt >= bucketStart && createdAt < bucketEnd;
    });
    const intensityAverage =
      bucketDetections.length > 0
        ? bucketDetections.reduce((sum, detection) => sum + detection.intensity, 0) / bucketDetections.length
        : 46 + (index % 7) * 4;
    const acousticActivity = Number(Math.max(1.1, Math.min(9.8, intensityAverage / 10)).toFixed(1));
    const emergenceProbability = Math.max(24, Math.min(93, Math.round(42 + acousticActivity * 5 + (index % 6) * 3)));

    return {
      acousticActivity,
      alertCount: bucketAlerts.length,
      emergenceProbability,
      id: `timeline-${String(index + 1).padStart(2, "0")}`,
      observationCount: 8 + bucketDetections.length * 3 + (index % 5),
      timestamp: new Date(bucketStart).toISOString(),
    };
  });
}

function observationsFor(coreBootstrap: CoreBootstrap) {
  return coreBootstrap.sites.flatMap((site, siteIndex) =>
    Array.from({ length: 48 }, (_, observationIndex) => {
      const arc = observationIndex / 7;
      const eastKilometers = Math.cos(arc) * (0.35 + (observationIndex % 5) * 0.19);
      const northKilometers = Math.sin(arc) * (0.28 + (observationIndex % 4) * 0.15);

      return {
        coordinates: offsetCoordinates(site.coordinates, eastKilometers, northKilometers),
        id: `${site.id}-observation-${String(observationIndex + 1).padStart(3, "0")}`,
        intensity: 32 + ((siteIndex * 13 + observationIndex * 7) % 64),
        observedAt: new Date(
          Date.parse(DEFAULT_WORKSPACE_TIMESTAMP) - (siteIndex * 17 + observationIndex * 11) * 60 * 1000,
        ).toISOString(),
        siteId: site.id,
        speciesLabel:
          observationIndex % 3 === 0
            ? "Common Cicada"
            : observationIndex % 3 === 1
              ? "Ash Cicada"
              : "Field Observation",
      };
    }),
  );
}

function habitatReadingsFor(coreBootstrap: CoreBootstrap) {
  return coreBootstrap.sites.flatMap((site, siteIndex) =>
    Array.from({ length: 96 }, (_, readingIndex) => {
      const eastKilometers = -2.6 + (readingIndex % 12) * 0.42;
      const northKilometers = -1.8 + Math.floor(readingIndex / 12) * 0.4;

      return {
        coordinates: offsetCoordinates(site.coordinates, eastKilometers, northKilometers),
        id: `${site.id}-habitat-${String(readingIndex + 1).padStart(3, "0")}`,
        moisturePercent: 34 + ((siteIndex * 11 + readingIndex * 5) % 47),
        siteId: site.id,
        vegetationHealth: 46 + ((siteIndex * 17 + readingIndex * 3) % 50),
      };
    }),
  );
}

function alertZonesFor(coreBootstrap: CoreBootstrap) {
  return coreBootstrap.alerts.slice(0, 4).flatMap((alert, index) => {
    const site = coreBootstrap.sites.find((candidate) => candidate.id === alert.siteId);
    if (!site) {
      return [];
    }

    return [
      {
        coordinates: buildRoundedPolygon(site.coordinates, 0.8 + index * 0.16, 0.65 + index * 0.12),
        id: `alert-zone-${alert.id}`,
        label: alert.message,
        severity: alert.severity,
        siteId: alert.siteId,
      },
    ];
  });
}

export class MonitoringBootstrapProjector {
  public static project(coreBootstrap: CoreBootstrap) {
    const workspaceTimestamp = latestTimestamp(coreBootstrap);
    const timeline = timelineFor(coreBootstrap, workspaceTimestamp);
    const recentTimeline = timeline.slice(-6);

    return {
      alerts: coreBootstrap.alerts,
      alertZones: alertZonesFor(coreBootstrap),
      detections: coreBootstrap.detections,
      habitatReadings: habitatReadingsFor(coreBootstrap),
      observations: observationsFor(coreBootstrap),
      organizations: coreBootstrap.organizations,
      projects: coreBootstrap.projects,
      sensors: coreBootstrap.sensors,
      sites: coreBootstrap.sites.map((site) => {
        const metadata = sitePresentationFor(site.id);
        return {
          ...site,
          broodLabel: metadata.broodLabel,
          elevationMeters: metadata.elevationMeters,
          emergenceWindow: metadata.emergenceWindow,
          habitatClass: metadata.habitatClass,
          seasonProgress: metadata.seasonProgress,
          territoryId: `territory-${site.id}`,
        };
      }),
      sourceHealth: coreBootstrap.sourceHealth,
      species: coreBootstrap.species,
      summary: {
        acousticActivity:
          recentTimeline.length > 0
            ? Number(
                (
                  recentTimeline.reduce((sum, point) => sum + point.acousticActivity, 0) / recentTimeline.length
                ).toFixed(1),
              )
            : 0,
        activeAlerts: coreBootstrap.alerts.length,
        dataFreshnessSeconds: latestFreshnessSeconds(workspaceTimestamp, coreBootstrap.sourceHealth),
        emergenceProbability:
          recentTimeline.length > 0
            ? Math.round(
                recentTimeline.reduce((sum, point) => sum + point.emergenceProbability, 0) / recentTimeline.length,
              )
            : 0,
        speciesConfidence: averageConfidencePercent(coreBootstrap.detections),
      },
      territories: coreBootstrap.sites.map((site) => {
        const metadata = sitePresentationFor(site.id);
        return {
          coordinates: buildRoundedPolygon(
            site.coordinates,
            metadata.eastRadiusKilometers,
            metadata.northRadiusKilometers,
          ),
          id: `territory-${site.id}`,
          name: `${site.name} Territory`,
        };
      }),
      timeline,
      weather: {
        humidity: 64,
        precipitationMmH: 0.2,
        temperatureC: 24.6,
        windDirection: "NW",
        windSpeedKmh: 12,
      },
      workspace: {
        id: FIXTURE_WORKSPACE_ID,
        mode: "live",
        name: coreBootstrap.projects[0]?.name ?? "Monitoring Workspace",
        timestamp: workspaceTimestamp,
      },
    };
  }
}
