import { describe, expect, it } from "vitest";
import { TimelineSummary } from "./timeline-summary.js";

describe("TimelineSummary", () => {
  it("builds timeline bars across the selected window", () => {
    const bars = TimelineSummary.buildBars(
      [
        {
          id: "d-1",
          siteId: "site-1",
          sensorId: "sensor-1",
          speciesId: "species-1",
          confidence: 0.9,
          intensity: 80,
          recordedAt: "2026-05-29T09:15:00.000Z",
        },
        {
          id: "d-2",
          siteId: "site-1",
          sensorId: "sensor-1",
          speciesId: "species-1",
          confidence: 0.8,
          intensity: 70,
          recordedAt: "2026-05-29T11:45:00.000Z",
        },
      ],
      "24h",
      new Date("2026-05-29T12:00:00.000Z"),
      6,
    );

    expect(bars).toHaveLength(6);
    expect(TimelineSummary.peakCount(bars)).toBeGreaterThanOrEqual(1);
    expect(bars.reduce((sum, bar) => sum + bar.count, 0)).toBe(2);
  });

  it("describes the current window", () => {
    expect(TimelineSummary.describeWindow("24h")).toBe("24 hours");
    expect(TimelineSummary.describeWindow("season")).toBe("Season");
  });
});
