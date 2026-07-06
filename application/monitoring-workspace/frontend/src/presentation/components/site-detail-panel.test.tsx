import "../../app/i18n.js";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteDetailPanel } from "./site-detail-panel.js";

describe("SiteDetailPanel", () => {
  it("renders the selected site metadata, detections, diagnostics, alerts, and freshness", () => {
    render(
      <SiteDetailPanel
        alerts={[
          {
            id: "alert-1",
            siteId: "site-1",
            severity: "warning",
            kind: "stale_source",
            message: "Source is stale",
            createdAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
        detections={[
          {
            id: "detection-1",
            siteId: "site-1",
            sensorId: "sensor-1",
            speciesId: "species-1",
            confidence: 0.91,
            intensity: 83,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
        sensors={[
          {
            id: "sensor-1",
            siteId: "site-1",
            name: "Ridge Acoustic Node 01",
            coordinates: { latitude: 43.5325, longitude: 5.575 },
            status: "active",
          },
        ]}
        site={{
          id: "site-1",
          name: "Sainte-Victoire Ridge",
          coordinates: { latitude: 43.532, longitude: 5.574 },
          habitatScore: 82,
        }}
        sourceHealth={[
          {
            sourceId: "sensor-1",
            siteId: "site-1",
            status: "active",
            lastSeenAt: "2026-05-29T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Sainte-Victoire Ridge" })).toBeInTheDocument();
    expect(screen.getByText(/Habitat score 82/)).toBeInTheDocument();
    expect(screen.getByLabelText("Live detections")).toHaveTextContent("sensor-1");
    expect(screen.getByLabelText("Sensor diagnostics")).toHaveTextContent("Ridge Acoustic Node 01");
    expect(screen.getByLabelText("Alerts")).toHaveTextContent("Source is stale");
    expect(screen.getByLabelText("Source freshness details")).toHaveTextContent("sensor-1");
  });

  it("renders the empty site state", () => {
    render(<SiteDetailPanel alerts={[]} detections={[]} sensors={[]} site={null} sourceHealth={[]} />);

    expect(screen.getByText("Select a monitored site")).toBeInTheDocument();
  });
});
