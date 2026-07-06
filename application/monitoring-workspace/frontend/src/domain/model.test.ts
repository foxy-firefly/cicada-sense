import { describe, expect, it } from "vitest";
import { DashboardModel } from "./model.js";

describe("DashboardModel", () => {
  it("summarizes freshness without hiding stale sources", () => {
    const summary = DashboardModel.freshnessSummary([
      { sourceId: "a", siteId: "site", status: "active", lastSeenAt: null },
      { sourceId: "b", siteId: "site", status: "stale", lastSeenAt: null },
    ]);

    expect(summary.active).toBe(1);
    expect(summary.stale).toBe(1);
  });

  it("filters detections by time window with frozen time", () => {
    const filteredDetections = DashboardModel.filterDetectionsByTimeWindow(
      [
        {
          id: "detection-recent",
          siteId: "site",
          sensorId: "sensor",
          speciesId: "species",
          confidence: 0.9,
          intensity: 80,
          recordedAt: "2026-05-29T11:30:00.000Z",
        },
        {
          id: "detection-older",
          siteId: "site",
          sensorId: "sensor",
          speciesId: "species",
          confidence: 0.9,
          intensity: 80,
          recordedAt: "2026-05-29T05:30:00.000Z",
        },
      ],
      "1h",
      new Date("2026-05-29T12:00:00.000Z"),
    );

    expect(filteredDetections).toHaveLength(1);
    expect(filteredDetections[0]?.id).toBe("detection-recent");
  });
});
