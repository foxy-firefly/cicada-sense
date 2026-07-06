import type { AlertKind, CicadaDataset, SourceStatus } from "../domain/model.js";
import { Alert, Detection, Organization, Project, Sensor, Site, SourceHealth, Species } from "../domain/model.js";

export class StaticFixtureDataset {
  public static demo(): CicadaDataset {
    const sites = [
      {
        id: "site-sainte-victoire",
        name: "Sainte-Victoire Ridge",
        coordinates: { latitude: 43.532, longitude: 5.574 },
        habitatScore: 82,
      },
      {
        id: "site-calanques",
        name: "Calanques North Slope",
        coordinates: { latitude: 43.214, longitude: 5.447 },
        habitatScore: 68,
      },
      {
        id: "site-luberon-east",
        name: "Luberon East Grove",
        coordinates: { latitude: 43.821, longitude: 5.351 },
        habitatScore: 76,
      },
      {
        id: "site-verdon-south",
        name: "Verdon South Plateau",
        coordinates: { latitude: 43.727, longitude: 6.328 },
        habitatScore: 71,
      },
      {
        id: "site-camargue-west",
        name: "Camargue West Marsh",
        coordinates: { latitude: 43.487, longitude: 4.412 },
        habitatScore: 64,
      },
      {
        id: "site-alpilles-north",
        name: "Alpilles North Terrace",
        coordinates: { latitude: 43.792, longitude: 4.843 },
        habitatScore: 73,
      },
    ] as const;

    const sensors = sites.flatMap((site, siteIndex) =>
      Array.from({ length: 3 }, (_, sensorIndex) => {
        const status: SourceStatus =
          siteIndex === 1 && sensorIndex === 2
            ? "stale"
            : siteIndex === 4 && sensorIndex === 1
              ? "disabled"
              : sensorIndex === 2 && siteIndex % 2 === 0
                ? "cooldown"
                : "active";

        return {
          id: `sensor-${site.id}-${sensorIndex + 1}`,
          siteId: site.id,
          name: `${site.name} Node ${sensorIndex + 1}`,
          coordinates: {
            latitude: Number((site.coordinates.latitude + sensorIndex * 0.006 - 0.004).toFixed(4)),
            longitude: Number((site.coordinates.longitude + sensorIndex * 0.007 - 0.003).toFixed(4)),
          },
          status,
        };
      }),
    );

    const detections = sensors.slice(0, 12).map((sensor, index) => ({
      id: `detection-fixture-${String(index + 1).padStart(3, "0")}`,
      siteId: sensor.siteId,
      sensorId: sensor.id,
      speciesId: index % 2 === 0 ? "species-lyristes-plebejus" : "species-cicada-orni",
      confidence: Number((0.68 + (index % 4) * 0.07).toFixed(2)),
      intensity: 54 + (index % 6) * 7,
      recordedAt: `2026-05-29T${String(8 + (index % 6)).padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}:00.000Z`,
    }));

    const sourceHealth = sensors.map((sensor, index) => ({
      sourceId: sensor.id,
      siteId: sensor.siteId,
      status: sensor.status,
      lastSeenAt:
        sensor.status === "disabled"
          ? null
          : `2026-05-29T${String(9 + (index % 4)).padStart(2, "0")}:${index % 2 === 0 ? "10" : "40"}:00.000Z`,
      expectedIntervalSeconds: 60,
      failureCount: sensor.status === "active" ? 0 : sensor.status === "stale" ? 1 : 2,
    }));

    return {
      organizations: [Organization.create({ id: "org-cicada-lab", name: "Cicada Lab" })],
      projects: [
        Project.create({
          id: "project-provence-2026",
          organizationId: "org-cicada-lab",
          name: "Province 2026",
        }),
      ],
      sites: sites.map((site) =>
        Site.create({
          id: site.id,
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          name: site.name,
          coordinates: site.coordinates,
          habitatScore: site.habitatScore,
        }),
      ),
      sensors: sensors.map((sensor) =>
        Sensor.create({
          id: sensor.id,
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: sensor.siteId,
          name: sensor.name,
          coordinates: sensor.coordinates,
          status: sensor.status,
          expectedIntervalSeconds: 60,
        }),
      ),
      species: [
        Species.create({
          id: "species-lyristes-plebejus",
          scientificName: "Lyristes plebejus",
          commonName: "Common Cicada",
        }),
        Species.create({
          id: "species-cicada-orni",
          scientificName: "Cicada orni",
          commonName: "Ash Cicada",
        }),
      ],
      detections: detections.map((detection) =>
        Detection.create({
          id: detection.id,
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: detection.siteId,
          sensorId: detection.sensorId,
          speciesId: detection.speciesId,
          confidence: detection.confidence,
          intensity: detection.intensity,
          recordedAt: detection.recordedAt,
        }),
      ),
      sourceHealth: sourceHealth.map((source) =>
        SourceHealth.create({
          sourceId: source.sourceId,
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: source.siteId,
          status: source.status,
          lastSeenAt: source.lastSeenAt,
          expectedIntervalSeconds: source.expectedIntervalSeconds,
          failureCount: source.failureCount,
        }),
      ),
      alerts: [
        Alert.create({
          id: "alert-fixture-stale-calanques",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-calanques",
          severity: "warning",
          kind: "stale_source",
          message: "Calanques acoustic source is stale.",
          createdAt: "2026-05-29T10:00:00.000Z",
        }),
        Alert.create({
          id: "alert-fixture-ridge-spike",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          severity: "warning",
          kind: "chorus_spike",
          message: "Ridge chorus intensity exceeded the configured site baseline.",
          createdAt: "2026-05-29T10:10:00.000Z",
        }),
        Alert.create({
          id: "alert-fixture-verdon-heat",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-verdon-south",
          severity: "critical",
          kind: "habitat_risk" satisfies AlertKind,
          message: "Verdon plateau habitat is entering a heat stress window.",
          createdAt: "2026-05-29T10:20:00.000Z",
        }),
        Alert.create({
          id: "alert-fixture-camargue-offline",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-camargue-west",
          severity: "info",
          kind: "sensor_outage" satisfies AlertKind,
          message: "Camargue marsh station is offline pending field maintenance.",
          createdAt: "2026-05-29T10:25:00.000Z",
        }),
      ],
    };
  }
}
