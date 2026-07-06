import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../app/query-client.js";
import { useDashboard } from "./use-dashboard.js";

function TestQueryProvider({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe("useDashboard realtime updates", () => {
  it("applies detection and alert events once without duplicating records", async () => {
    const getBootstrap = vi.fn().mockResolvedValue({
      alerts: [],
      detections: [],
      sensors: [
        {
          id: "sensor-1",
          siteId: "site-1",
          name: "Sensor 1",
          coordinates: { latitude: 1, longitude: 2 },
          status: "active",
        },
      ],
      sites: [
        {
          id: "site-1",
          name: "Site 1",
          coordinates: { latitude: 1, longitude: 2 },
          habitatScore: 82,
        },
      ],
      sourceHealth: [
        {
          sourceId: "sensor-1",
          siteId: "site-1",
          status: "active",
          lastSeenAt: "2026-05-29T10:00:00.000Z",
        },
      ],
      species: [],
    });

    let publishDetection:
      | ((detection: {
          id: string;
          siteId: string;
          sensorId: string;
          speciesId: string;
          confidence: number;
          intensity: number;
          recordedAt: string;
        }) => void)
      | undefined;
    let publishAlert:
      | ((alert: {
          id: string;
          siteId: string;
          severity: "info" | "warning" | "critical";
          kind: string;
          message: string;
          createdAt: string;
        }) => void)
      | undefined;

    const realtimeClient = {
      connect: vi
        .fn()
        .mockImplementation(
          (
            _projectId: string,
            onDetection: (detection: {
              id: string;
              siteId: string;
              sensorId: string;
              speciesId: string;
              confidence: number;
              intensity: number;
              recordedAt: string;
            }) => void,
            onAlert: (alert: {
              id: string;
              siteId: string;
              severity: "info" | "warning" | "critical";
              kind: string;
              message: string;
              createdAt: string;
            }) => void,
          ) => {
            publishDetection = onDetection;
            publishAlert = onAlert;
            return () => undefined;
          },
        ),
    };

    const client = { getBootstrap };

    const { result } = renderHook(
      () =>
        useDashboard(client as never, realtimeClient as never, undefined, () => new Date("2026-05-29T10:10:00.000Z")),
      { wrapper: TestQueryProvider },
    );

    await waitFor(() => expect(result.current.data.sensors).toHaveLength(1));

    const realtimeDetection = {
      id: "detection-1",
      siteId: "site-1",
      sensorId: "sensor-1",
      speciesId: "species-1",
      confidence: 0.91,
      intensity: 84,
      recordedAt: "2026-05-29T10:05:00.000Z",
    };
    const realtimeAlert = {
      id: "alert-1",
      siteId: "site-1",
      severity: "warning" as const,
      kind: "chorus_spike",
      message: "Chorus intensity exceeded the configured site baseline.",
      createdAt: "2026-05-29T10:05:00.000Z",
    };

    act(() => {
      publishDetection?.(realtimeDetection);
      publishDetection?.(realtimeDetection);
      publishAlert?.(realtimeAlert);
      publishAlert?.(realtimeAlert);
    });

    expect(result.current.filteredDetections).toHaveLength(1);
    expect(result.current.filteredDetections[0]?.id).toBe("detection-1");
    expect(result.current.data.alerts).toHaveLength(1);
    expect(result.current.data.alerts[0]?.id).toBe("alert-1");
    expect(result.current.activeDetectionCount).toBe(1);
  });
});
