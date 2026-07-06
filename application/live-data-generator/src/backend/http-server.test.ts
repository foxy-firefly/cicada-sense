import { afterEach, describe, expect, it } from "vitest";
import type { GeneratedEvent } from "../shared/contracts.js";
import { BackendEventPublisher } from "./event-publisher.js";
import { GeneratorHttpServer } from "./http-server.js";
import { GeneratorObservability, type StructuredLogEntry, type StructuredLogger } from "./observability.js";
import { PlaybackService } from "./playback-service.js";
import { GeneratorSecurity } from "./security.js";

class RecordingLogger implements StructuredLogger {
  public readonly entries: StructuredLogEntry[] = [];

  public log(entry: StructuredLogEntry): void {
    this.entries.push(entry);
  }
}

class RecordingPublisher extends BackendEventPublisher {
  public readonly requestIds: string[] = [];

  public constructor(private readonly runtimeObservability: GeneratorObservability) {
    super("http://localhost:0", runtimeObservability);
  }

  public override async publish(event: GeneratedEvent, requestId?: string): Promise<void> {
    if (requestId) {
      this.requestIds.push(requestId);
      this.runtimeObservability.recordPublishedEvent(requestId, event);
    }

    return Promise.resolve();
  }
}

describe("GeneratorHttpServer", () => {
  let server: GeneratorHttpServer | null = null;

  afterEach(async () => {
    await server?.close();
    server = null;
  });

  it("supports the full playback control API", async () => {
    const observability = new GeneratorObservability();
    server = new GeneratorHttpServer(new PlaybackService(new RecordingPublisher(observability)), observability);
    await server.listen(0);

    const address = server.address();
    const healthRequestId = "req-generator-health";

    const healthResponse = await fetch(`${address}/health`, {
      headers: { "x-request-id": healthRequestId },
    });
    const health = await healthResponse.json();
    const scenarios = await fetch(`${address}/api/scenarios`).then((response) => response.json());
    expect(scenarios.length).toBeGreaterThan(0);
    expect(health.status).toBe("ok");
    expect(health.service).toBe("live-data-generator");
    expect(health.uptimeSeconds).toEqual(expect.any(Number));
    expect(healthResponse.headers.get("x-request-id")).toBe(healthRequestId);

    const started = await fetch(`${address}/api/playback/start`, {
      body: JSON.stringify({ scenarioId: "chorus-spike", speed: 1 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((response) => response.json());
    expect(started.currentScenarioId).toBe("chorus-spike");

    const paused = await fetch(`${address}/api/playback/pause`, { method: "POST" }).then((response) => response.json());
    expect(paused.isPlaying).toBe(false);

    const spedUp = await fetch(`${address}/api/playback/speed`, {
      body: JSON.stringify({ speed: 4 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((response) => response.json());
    expect(spedUp.speed).toBe(4);

    const failed = await fetch(`${address}/api/playback/failures`, {
      body: JSON.stringify({ kind: "stale", sourceId: "sensor-site-sainte-victoire-1" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).then((response) => response.json());
    expect(failed.emittedEvents.at(-1)?.sensorId).toBe("sensor-site-sainte-victoire-1");

    const stopped = await fetch(`${address}/api/playback/stop`, { method: "POST" }).then((response) => response.json());
    expect(stopped.currentScenarioId).toBeNull();

    const state = await fetch(`${address}/api/playback`).then((response) => response.json());
    const metrics = await fetch(`${address}/metrics`).then((response) => response.json());
    expect(state.speed).toBe(4);
    expect(state.isPlaying).toBe(false);
    expect(metrics.service).toBe("live-data-generator");
    expect(metrics.requestsTotal).toBeGreaterThanOrEqual(8);
    expect(metrics.requestsByPath["/api/playback/start"]).toBeGreaterThanOrEqual(1);
    expect(metrics.publishedEvents).toBeGreaterThanOrEqual(25);
  });

  it("propagates request IDs into published events and structured logs", async () => {
    const logger = new RecordingLogger();
    const observability = new GeneratorObservability(logger);
    const publisher = new RecordingPublisher(observability);

    server = new GeneratorHttpServer(new PlaybackService(publisher), observability);
    await server.listen(0);

    const address = server.address();
    const requestId = "trace-generator-001";
    const response = await fetch(`${address}/api/playback/start`, {
      body: JSON.stringify({ scenarioId: "chorus-spike", speed: 1 }),
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      method: "POST",
    });

    expect(response.status).toBe(202);
    expect(response.headers.get("x-request-id")).toBe(requestId);
    expect(publisher.requestIds.length).toBeGreaterThanOrEqual(20);
    expect(
      logger.entries.filter((entry) => entry.event === "generator.event.published" && entry.requestId === requestId),
    ).toHaveLength(publisher.requestIds.length);
    expect(
      logger.entries.some(
        (entry) =>
          entry.event === "http.request.completed" &&
          entry.path === "/api/playback/start" &&
          entry.requestId === requestId &&
          entry.statusCode === 202,
      ),
    ).toBe(true);
  });

  it("rejects disallowed origins", async () => {
    server = new GeneratorHttpServer(new PlaybackService(new RecordingPublisher(new GeneratorObservability())));
    await server.listen(0);

    const response = await fetch(`${server.address()}/api/scenarios`, {
      headers: { origin: "https://evil.example" },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "DISALLOWED_ORIGIN" });
  });

  it("rate limits repeated control requests", async () => {
    server = new GeneratorHttpServer(
      new PlaybackService(new RecordingPublisher(new GeneratorObservability())),
      new GeneratorObservability(),
      new GeneratorSecurity({
        rateLimitMaxRequests: 2,
        rateLimitWindowMs: 60_000,
      }),
    );
    await server.listen(0);

    const address = server.address();
    expect((await fetch(`${address}/api/scenarios`)).status).toBe(200);
    expect((await fetch(`${address}/api/scenarios`)).status).toBe(200);

    const rateLimited = await fetch(`${address}/api/scenarios`);

    expect(rateLimited.status).toBe(429);
    await expect(rateLimited.json()).resolves.toEqual({ error: "RATE_LIMITED" });
  });
});
