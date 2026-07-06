import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../app/query-client.js";
import { useDashboard } from "./use-dashboard.js";

function TestQueryProvider({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe("useDashboard timeline filtering", () => {
  it("filters detections by selected time window without reloading the page", async () => {
    const getBootstrap = vi.fn().mockResolvedValue({
      alerts: [],
      detections: [
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
          confidence: 0.8,
          intensity: 55,
          recordedAt: "2026-05-29T05:30:00.000Z",
        },
      ],
      sensors: [
        {
          id: "sensor",
          siteId: "site",
          name: "Sensor",
          coordinates: { latitude: 1, longitude: 2 },
          status: "active",
        },
      ],
      sites: [
        {
          id: "site",
          name: "Sainte-Victoire",
          coordinates: { latitude: 1, longitude: 2 },
          habitatScore: 82,
        },
      ],
      sourceHealth: [],
      species: [],
    });

    const realtimeClient = {
      connect: vi.fn().mockReturnValue(() => undefined),
    };
    const client = { getBootstrap };

    const { result } = renderHook(
      () =>
        useDashboard(client as never, realtimeClient as never, undefined, () => new Date("2026-05-29T12:00:00.000Z")),
      { wrapper: TestQueryProvider },
    );

    await waitFor(() => expect(result.current.data.detections).toHaveLength(2));

    expect(result.current.filteredDetections).toHaveLength(2);

    act(() => {
      result.current.setTimeWindow("1h");
    });

    expect(result.current.filteredDetections).toHaveLength(1);
    expect(result.current.filteredDetections[0]?.id).toBe("detection-recent");
    expect(getBootstrap).toHaveBeenCalledTimes(1);
  });
});
