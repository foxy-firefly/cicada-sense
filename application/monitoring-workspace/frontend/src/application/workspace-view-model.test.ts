import { describe, expect, it } from "vitest";
import { WorkspaceViewModel } from "./workspace-view-model.js";

describe("WorkspaceViewModel", () => {
  it("builds sensor markers from sensors and sites", () => {
    const markers = WorkspaceViewModel.buildSensorMarkers(
      [
        {
          id: "sensor-1",
          siteId: "site-1",
          name: "Ridge Acoustic Node 01",
          coordinates: { latitude: 43.5325, longitude: 5.575 },
          status: "active",
        },
        {
          id: "sensor-2",
          siteId: "site-2",
          name: "Calanques Acoustic Node 01",
          coordinates: { latitude: 43.2145, longitude: 5.4475 },
          status: "stale",
        },
      ],
      [
        {
          id: "site-1",
          name: "Sainte-Victoire Ridge",
          coordinates: { latitude: 43.532, longitude: 5.574 },
          habitatScore: 82,
        },
        {
          id: "site-2",
          name: "Calanques North Slope",
          coordinates: { latitude: 43.214, longitude: 5.447 },
          habitatScore: 68,
        },
      ],
      "site-1",
    );

    expect(markers).toHaveLength(2);
    expect(markers[0]?.label).toBe("Sainte-Victoire Ridge");
    expect(markers[0]?.isSelected).toBe(true);
    expect(markers[1]?.status).toBe("stale");
    expect(markers[0]?.leftPercent).not.toBe(markers[1]?.leftPercent);
  });

  it("builds workspace summary counts", () => {
    const summary = WorkspaceViewModel.buildWorkspaceSummary(
      [
        {
          id: "site-1",
          name: "Sainte-Victoire Ridge",
          coordinates: { latitude: 43.532, longitude: 5.574 },
          habitatScore: 82,
        },
      ],
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
          id: "alert-1",
          siteId: "site-1",
          severity: "warning",
          kind: "stale_source",
          message: "Source is stale",
          createdAt: "2026-05-29T10:00:00.000Z",
        },
      ],
      { active: 1, stale: 0, cooldown: 0, disabled: 0, error: 0 },
    );

    expect(summary.sites).toBe(1);
    expect(summary.onlineSensors).toBe(1);
    expect(summary.activeAlerts).toBe(1);
    expect(summary.dataStreams).toBe(1);
  });

  it("formats site coordinates", () => {
    expect(
      WorkspaceViewModel.formatCoordinates({
        id: "site-1",
        name: "Sainte-Victoire Ridge",
        coordinates: { latitude: 43.532, longitude: 5.574 },
        habitatScore: 82,
      }),
    ).toBe("lat 43.5320°  lon 5.5740°");
    expect(WorkspaceViewModel.formatCoordinates(null)).toBe("--");
  });

  it("formats freshness seconds including current values", () => {
    expect(WorkspaceViewModel.formatFreshnessSeconds(undefined)).toBe("No data");
    expect(WorkspaceViewModel.formatFreshnessSeconds(0)).toBe("0m 00s ago");
    expect(WorkspaceViewModel.formatFreshnessSeconds(134)).toBe("2m 14s ago");
  });

  it("builds workspace chrome summary values", () => {
    const summary = WorkspaceViewModel.buildWorkspaceChromeSummary();

    expect(summary.organizationName).toBe("Eco Research Lab");
    expect(summary.temperatureC).toBe(24.6);
    expect(summary.windDirection).toBe("NW");
  });
});
