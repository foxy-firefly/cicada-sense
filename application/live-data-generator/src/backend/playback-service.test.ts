import { describe, expect, it } from "vitest";
import type { GeneratedEvent } from "../shared/contracts.js";
import { BackendEventPublisher } from "./event-publisher.js";
import { PlaybackService } from "./playback-service.js";

class RecordingPublisher extends BackendEventPublisher {
  public readonly events: GeneratedEvent[] = [];
  public readonly requestIds: string[] = [];

  public constructor() {
    super("http://localhost:0");
  }

  public override async publish(event: GeneratedEvent, requestId?: string): Promise<void> {
    this.events.push(event);
    if (requestId) {
      this.requestIds.push(requestId);
    }
  }
}

describe("PlaybackService", () => {
  it("publishes scenario events through the backend publisher", async () => {
    const publisher = new RecordingPublisher();
    const service = new PlaybackService(publisher);

    const state = await service.start({ scenarioId: "chorus-spike", speed: 1 });

    expect(publisher.events.length).toBeGreaterThanOrEqual(20);
    expect(state.emittedEvents).toHaveLength(publisher.events.length);
    expect(state.isPlaying).toBe(false);
  });

  it("updates playback speed deterministically", () => {
    const publisher = new RecordingPublisher();
    const service = new PlaybackService(publisher);

    const state = service.setSpeed({ speed: 3 });

    expect(state.speed).toBe(3);
    expect(service.getState().speed).toBe(3);
  });

  it("stops playback and clears the active scenario", () => {
    const publisher = new RecordingPublisher();
    const service = new PlaybackService(publisher);

    service.setSpeed({ speed: 2 });
    const state = service.stop();

    expect(state.isPlaying).toBe(false);
    expect(state.currentScenarioId).toBeNull();
    expect(state.speed).toBe(2);
  });

  it("injects failure events through the publisher", async () => {
    const publisher = new RecordingPublisher();
    const service = new PlaybackService(publisher);

    const state = await service.injectFailure({ kind: "outage", sourceId: "sensor-site-sainte-victoire-1" });

    expect(publisher.events).toHaveLength(1);
    expect(state.emittedEvents).toHaveLength(1);
    expect(state.emittedEvents[0]?.sensorId).toBe("sensor-site-sainte-victoire-1");
    expect(state.emittedEvents[0]?.intensity).toBe(0);
    expect(state.emittedEvents[0]?.siteId).toBe("site-sainte-victoire");
  });
});
