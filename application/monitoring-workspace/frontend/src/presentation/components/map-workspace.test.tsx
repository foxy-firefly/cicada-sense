import "../../app/i18n.js";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MapWorkspace } from "./map-workspace.js";

describe("MapWorkspace", () => {
  it("renders one visible marker per sensor with health state and accessible labels", () => {
    const onSelectSite = vi.fn();

    render(
      <MapWorkspace
        layerVisibility={{
          acoustic: true,
          species: true,
          microclimate: true,
          habitat: true,
          observations: true,
          sensorHealth: true,
        }}
        onSelectSite={onSelectSite}
        selectedSiteId="site-sainte-victoire"
        sensors={[
          {
            id: "sensor-ridge-01",
            siteId: "site-sainte-victoire",
            name: "Ridge Acoustic Node 01",
            coordinates: { latitude: 43.5325, longitude: 5.575 },
            status: "active",
          },
          {
            id: "sensor-calanques-01",
            siteId: "site-calanques",
            name: "Calanques Acoustic Node 01",
            coordinates: { latitude: 43.2145, longitude: 5.4475 },
            status: "stale",
          },
        ]}
        sites={[
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
        ]}
      />,
    );

    const ridgeMarker = screen.getByRole("button", { name: "Sainte-Victoire Ridge" });
    const calanquesMarker = screen.getByRole("button", { name: "Calanques North Slope" });

    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("Map legend")).toBeInTheDocument();
    expect(screen.getByText("Terrain focus")).toBeInTheDocument();
    expect(screen.getByText("Habitat score")).toBeInTheDocument();
    expect(ridgeMarker).toHaveClass("sensor-marker--active");
    expect(calanquesMarker).toHaveClass("sensor-marker--stale");
    expect(ridgeMarker).toHaveClass("sensor-marker--selected");
    expect(ridgeMarker).toHaveAttribute("aria-pressed", "true");
    expect(calanquesMarker).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(calanquesMarker);

    expect(onSelectSite).toHaveBeenCalledWith("site-calanques");
  });
});
