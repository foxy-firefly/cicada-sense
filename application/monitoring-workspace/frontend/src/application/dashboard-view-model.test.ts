import { describe, expect, it } from "vitest";
import { DashboardViewModel } from "./dashboard-view-model.js";

describe("DashboardViewModel", () => {
  it("summarizes signal rail values", () => {
    const summary = DashboardViewModel.summarizeSignalRail(
      [
        {
          id: "detection-1",
          siteId: "site-1",
          sensorId: "sensor-1",
          speciesId: "species-1",
          confidence: 0.92,
          intensity: 75,
          recordedAt: "2026-05-29T10:00:00.000Z",
        },
      ],
      [],
      { active: 1, stale: 0, cooldown: 0, disabled: 0, error: 0 },
      1,
    );

    expect(summary.activeDetectionValue).toBe(1);
    expect(summary.confidencePercent).toBe(92);
    expect(summary.freshnessKind).toBe("active");
    expect(summary.freshnessCount).toBe(1);
    expect(summary.anomalyKind).toBe("calm");
  });

  it("summarizes site detail slices", () => {
    const site = {
      id: "site-1",
      name: "Sainte-Victoire Ridge",
      coordinates: { latitude: 43.532, longitude: 5.574 },
      habitatScore: 82,
    };

    const summary = DashboardViewModel.summarizeSiteDetail(
      site,
      [
        {
          id: "sensor-1",
          siteId: "site-1",
          name: "Ridge Acoustic Node 01",
          coordinates: { latitude: 43.5325, longitude: 5.575 },
          status: "active",
        },
      ],
      [
        {
          id: "detection-1",
          siteId: "site-1",
          sensorId: "sensor-1",
          speciesId: "species-1",
          confidence: 0.91,
          intensity: 83,
          recordedAt: "2026-05-29T10:00:00.000Z",
        },
      ],
      [
        {
          sourceId: "sensor-1",
          siteId: "site-1",
          status: "active",
          lastSeenAt: "2026-05-29T10:00:00.000Z",
        },
      ],
      [
        {
          id: "alert-1",
          siteId: "site-1",
          severity: "warning",
          kind: "stale_source",
          message: "Source is stale",
          createdAt: "2026-05-29T10:00:00.000Z",
        },
      ],
    );

    expect(summary.siteSensors).toHaveLength(1);
    expect(summary.siteDetections).toHaveLength(1);
    expect(summary.siteHealth).toHaveLength(1);
    expect(summary.siteAlerts).toHaveLength(1);
    expect(summary.freshSources).toBe(1);
  });
});
