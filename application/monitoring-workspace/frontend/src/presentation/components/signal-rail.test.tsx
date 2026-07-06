import "../../app/i18n.js";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignalRail } from "./signal-rail.js";

describe("SignalRail", () => {
  it("renders fresh state", () => {
    render(
      <SignalRail
        activeDetectionCount={1}
        alerts={[]}
        detections={[
          {
            id: "detection-1",
            siteId: "site-1",
            sensorId: "sensor-1",
            speciesId: "species-1",
            confidence: 0.92,
            intensity: 75,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
        freshnessSummary={{ active: 1, stale: 0, cooldown: 0, disabled: 0, error: 0 }}
      />,
    );

    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getAllByText("1 fresh").length).toBeGreaterThan(0);
    expect(screen.getByText("Calm conditions")).toBeInTheDocument();
  });

  it("renders stale state", () => {
    render(
      <SignalRail
        activeDetectionCount={1}
        alerts={[]}
        detections={[
          {
            id: "detection-1",
            siteId: "site-1",
            sensorId: "sensor-1",
            speciesId: "species-1",
            confidence: 0.74,
            intensity: 52,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
        freshnessSummary={{ active: 0, stale: 1, cooldown: 0, disabled: 0, error: 0 }}
      />,
    );

    expect(screen.getAllByText("1 stale").length).toBeGreaterThan(0);
    expect(screen.getByText("Stale source detected")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <SignalRail
        activeDetectionCount={1}
        alerts={[]}
        detections={[
          {
            id: "detection-1",
            siteId: "site-1",
            sensorId: "sensor-1",
            speciesId: "species-1",
            confidence: 0.74,
            intensity: 52,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
        freshnessSummary={{ active: 0, stale: 0, cooldown: 1, disabled: 0, error: 1 }}
      />,
    );

    expect(screen.getAllByText("2 error detected").length).toBeGreaterThan(0);
    expect(screen.getByText("Sensor outage risk")).toBeInTheDocument();
  });

  it("renders no-data state distinctly from calm conditions", () => {
    render(
      <SignalRail
        activeDetectionCount={0}
        alerts={[]}
        detections={[]}
        freshnessSummary={{ active: 0, stale: 0, cooldown: 0, disabled: 0, error: 0 }}
      />,
    );

    expect(screen.getAllByText("No data").length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText("Calm conditions")).not.toBeInTheDocument();
  });
});
