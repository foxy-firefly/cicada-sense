import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../app/app.js";

interface MockDashboardState {
  activeDetectionCount: number;
  data: {
    alerts: Array<{ id: string; siteId: string; severity: string; kind: string; message: string }>;
    detections: Array<{
      id: string;
      siteId: string;
      sensorId: string;
      speciesId: string;
      confidence: number;
      intensity: number;
      recordedAt: string;
    }>;
    sensors: Array<{
      id: string;
      siteId: string;
      name: string;
      coordinates: { latitude: number; longitude: number };
      status: string;
    }>;
    sites: Array<{
      id: string;
      name: string;
      coordinates: { latitude: number; longitude: number };
      habitatScore: number;
    }>;
    sourceHealth: Array<{
      sourceId: string;
      siteId: string;
      status: string;
      lastSeenAt: string;
    }>;
  };
  error: string | null;
  filteredDetections: Array<{
    id: string;
    siteId: string;
    sensorId: string;
    speciesId: string;
    confidence: number;
    intensity: number;
    recordedAt: string;
  }>;
  freshnessSummary: {
    active: number;
    stale: number;
    cooldown: number;
    disabled: number;
    error: number;
  };
  isLoading: boolean;
  layerVisibility: {
    acoustic: boolean;
    species: boolean;
    microclimate: boolean;
    habitat: boolean;
    observations: boolean;
    sensorHealth: boolean;
  };
  selectedSite: {
    id: string;
    name: string;
    coordinates: { latitude: number; longitude: number };
    habitatScore: number;
  };
  selectedSiteId: string;
  setLayerEnabled: ReturnType<typeof vi.fn>;
  setSelectedSiteId: ReturnType<typeof vi.fn>;
  setTimeWindow: ReturnType<typeof vi.fn>;
  timeWindow: string;
}

const dashboardState: MockDashboardState = {
  activeDetectionCount: 1,
  data: {
    alerts: [
      {
        id: "alert",
        siteId: "site",
        severity: "warning",
        kind: "stale_source",
        message: "Source is stale",
      },
    ],
    detections: [
      {
        id: "detection",
        siteId: "site",
        sensorId: "sensor",
        speciesId: "species",
        confidence: 0.9,
        intensity: 80,
        recordedAt: "2026-05-29T10:00:00.000Z",
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
    sourceHealth: [
      {
        sourceId: "sensor",
        siteId: "site",
        status: "active",
        lastSeenAt: "2026-05-29T10:00:00.000Z",
      },
    ],
  },
  error: null,
  filteredDetections: [
    {
      id: "detection",
      siteId: "site",
      sensorId: "sensor",
      speciesId: "species",
      confidence: 0.9,
      intensity: 80,
      recordedAt: "2026-05-29T10:00:00.000Z",
    },
  ],
  freshnessSummary: {
    active: 1,
    stale: 0,
    cooldown: 0,
    disabled: 0,
    error: 0,
  },
  isLoading: false,
  layerVisibility: {
    acoustic: true,
    species: true,
    microclimate: true,
    habitat: true,
    observations: true,
    sensorHealth: true,
  },
  selectedSite: {
    id: "site",
    name: "Sainte-Victoire",
    coordinates: { latitude: 1, longitude: 2 },
    habitatScore: 82,
  },
  selectedSiteId: "site",
  setLayerEnabled: vi.fn(),
  setSelectedSiteId: vi.fn(),
  setTimeWindow: vi.fn(),
  timeWindow: "24h",
};

vi.mock("../application/use-dashboard.js", () => ({
  useDashboard: () => dashboardState,
}));

describe("App", () => {
  it("renders a loading state", () => {
    dashboardState.isLoading = true;
    render(<App />);

    expect(screen.getByText("Loading monitoring workspace...")).toBeInTheDocument();
  });

  it("renders the monitoring workspace", () => {
    dashboardState.isLoading = false;
    dashboardState.error = null;
    dashboardState.data.sites = [
      {
        id: "site",
        name: "Sainte-Victoire",
        coordinates: { latitude: 1, longitude: 2 },
        habitatScore: 82,
      },
    ];
    render(<App />);

    expect(screen.getByRole("heading", { name: "Cicada Sense" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByLabelText("Map workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Signals")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Timeline activity").length).toBeGreaterThan(0);
    expect(document.querySelector("footer.workspace-status-bar")).not.toBeNull();
  });

  it("renders an empty state", () => {
    dashboardState.isLoading = false;
    dashboardState.error = null;
    dashboardState.data.sites = [];
    dashboardState.filteredDetections = [];
    render(<App />);

    expect(screen.getByText("No monitored sites available yet.")).toBeInTheDocument();
  });

  it("renders an error state", () => {
    dashboardState.isLoading = false;
    dashboardState.error = "dashboard.errors.bootstrap";
    dashboardState.filteredDetections = dashboardState.data.detections;
    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent("dashboard.errors.bootstrap");
  });
});
