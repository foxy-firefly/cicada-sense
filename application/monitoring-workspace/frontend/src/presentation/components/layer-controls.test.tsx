import "../../app/i18n.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../app/query-client.js";
import { useDashboard } from "../../application/use-dashboard.js";
import { LayerControls } from "./layer-controls.js";
import { MapWorkspace } from "./map-workspace.js";

function TestQueryProvider({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe("layer visibility", () => {
  it("toggles layer visibility without refetching bootstrap data and persists state locally", async () => {
    const storageState = new Map<string, string>();
    const storage: Storage = {
      clear: () => storageState.clear(),
      getItem: (key) => storageState.get(key) ?? null,
      key: (index) => [...storageState.keys()][index] ?? null,
      get length() {
        return storageState.size;
      },
      removeItem: (key) => {
        storageState.delete(key);
      },
      setItem: (key, value) => {
        storageState.set(key, value);
      },
    };

    const getBootstrap = vi.fn().mockResolvedValue({
      alerts: [],
      detections: [],
      sensors: [
        {
          id: "sensor-ridge-01",
          siteId: "site-sainte-victoire",
          name: "Ridge Acoustic Node 01",
          coordinates: { latitude: 43.5325, longitude: 5.575 },
          status: "active",
        },
      ],
      sites: [
        {
          id: "site-sainte-victoire",
          name: "Sainte-Victoire Ridge",
          coordinates: { latitude: 43.532, longitude: 5.574 },
          habitatScore: 82,
        },
      ],
      sourceHealth: [],
      species: [],
    });
    const client = { getBootstrap };

    const realtimeClient = {
      connect: vi.fn().mockReturnValue(() => undefined),
    };

    function TestHarness() {
      const dashboard = useDashboard(client as never, realtimeClient as never, storage);

      if (dashboard.isLoading) {
        return <p>Loading...</p>;
      }

      return (
        <>
          <LayerControls
            baseMapStyle="dark-relief"
            layerVisibility={dashboard.layerVisibility}
            onBaseMapStyleChange={vi.fn()}
            onToggle={dashboard.setLayerEnabled}
          />
          <MapWorkspace
            layerVisibility={dashboard.layerVisibility}
            onSelectSite={dashboard.setSelectedSiteId}
            selectedSiteId={dashboard.selectedSiteId}
            sensors={dashboard.data.sensors}
            sites={dashboard.data.sites}
          />
        </>
      );
    }

    render(
      <TestQueryProvider>
        <TestHarness />
      </TestQueryProvider>,
    );

    const acousticToggle = await screen.findByRole("checkbox", { name: "Acoustic Activity" });
    const sensorHealthToggle = screen.getByRole("checkbox", { name: "Sensor Health" });
    const signalFocusPreset = screen.getByRole("button", { name: "Signal focus" });
    const visibleLayers = screen.getByLabelText("Visible layers");

    expect(getBootstrap).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Core signals")).toBeInTheDocument();
    expect(screen.getByText("Operational overlays")).toBeInTheDocument();
    expect(within(visibleLayers).getByText("Acoustic")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Barrington Marsh Preserve|Sainte-Victoire Ridge/ }).length,
    ).toBeGreaterThan(0);

    fireEvent.click(signalFocusPreset);

    expect(getBootstrap).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox", { name: "Acoustic Activity" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Vegetation Health" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Observations" })).not.toBeChecked();

    fireEvent.click(acousticToggle);
    fireEvent.click(sensorHealthToggle);

    expect(getBootstrap).toHaveBeenCalledTimes(1);
    expect(within(visibleLayers).queryByText("Acoustic")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /Barrington Marsh Preserve|Sainte-Victoire Ridge/ })).toHaveLength(
      0,
    );
    expect(storage.getItem("cicada-sense:layer-visibility")).toContain('"acoustic":false');
    expect(storage.getItem("cicada-sense:layer-visibility")).toContain('"observations":false');
    expect(storage.getItem("cicada-sense:layer-visibility")).toContain('"sensorHealth":false');
  });
});
