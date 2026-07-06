import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GeneratorApp } from "./app.js";
import type { GeneratorClient } from "./generator-client.js";

describe("GeneratorApp", () => {
  it("controls scenarios, speed, failures, and displays emitted events", async () => {
    const client: Pick<GeneratorClient, "injectFailure" | "listScenarios" | "pause" | "setSpeed" | "start" | "stop"> = {
      injectFailure: vi.fn().mockResolvedValue({
        currentScenarioId: "chorus-spike",
        emittedEvents: [
          {
            organizationId: "org",
            projectId: "project",
            siteId: "site",
            sensorId: "sensor-site-calanques-1",
            speciesId: "species",
            confidence: 0.18,
            intensity: 28,
            recordedAt: "2026-05-29T10:30:00.000Z",
          },
        ],
        isPlaying: false,
        speed: 2,
      }),
      listScenarios: vi.fn().mockResolvedValue([
        {
          id: "chorus-spike",
          name: "Chorus spike",
          description: "Spike",
          cadenceMs: 1,
          events: [],
        },
      ]),
      pause: vi.fn().mockResolvedValue({
        currentScenarioId: null,
        emittedEvents: [],
        isPlaying: false,
        speed: 1,
      }),
      setSpeed: vi.fn().mockResolvedValue({
        currentScenarioId: null,
        emittedEvents: [],
        isPlaying: false,
        speed: 2,
      }),
      start: vi.fn().mockResolvedValue({
        currentScenarioId: "chorus-spike",
        emittedEvents: [
          {
            organizationId: "org",
            projectId: "project",
            siteId: "site",
            sensorId: "sensor-site-sainte-victoire-1",
            speciesId: "species",
            confidence: 0.9,
            intensity: 96,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ],
        isPlaying: false,
        speed: 1,
      }),
      stop: vi.fn().mockResolvedValue({
        currentScenarioId: null,
        emittedEvents: [],
        isPlaying: false,
        speed: 2,
      }),
    };

    render(<GeneratorApp client={client as GeneratorClient} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Chorus spike" })).toBeInTheDocument());
    await waitFor(() => expect(client.start).toHaveBeenCalledWith({ scenarioId: "multi-site-campaign", speed: 1 }));

    fireEvent.change(screen.getByRole("combobox", { name: "Speed" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply speed" }));
    expect(client.setSpeed).toHaveBeenCalledWith({ speed: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(client.start).toHaveBeenNthCalledWith(2, { scenarioId: "multi-site-campaign", speed: 2 });
    expect(await screen.findByText("sensor-site-sainte-victoire-1 intensity 96")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Failure mode" }), { target: { value: "low_confidence" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Source" }), {
      target: { value: "sensor-site-calanques-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inject failure" }));

    expect(client.injectFailure).toHaveBeenCalledWith({ kind: "low_confidence", sourceId: "sensor-site-calanques-1" });
    expect(await screen.findByText("sensor-site-calanques-1 intensity 28")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(client.pause).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(client.stop).toHaveBeenCalled();
  });
});
