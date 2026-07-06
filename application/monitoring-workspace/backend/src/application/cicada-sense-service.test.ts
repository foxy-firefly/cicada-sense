import { describe, expect, it } from "vitest";
import { SourceHealth } from "../domain/model.js";
import { StaticFixtureDataset } from "../fixtures/static-fixtures.js";
import { EventEmitterRealtimePublisher } from "../infrastructure/event-emitter-realtime-publisher.js";
import { InMemoryCicadaRepository } from "../infrastructure/in-memory-cicada-repository.js";
import { CicadaSenseService } from "./cicada-sense-service.js";

describe("CicadaSenseService", () => {
  it("loads deterministic fixtures", async () => {
    const service = new CicadaSenseService(new InMemoryCicadaRepository(), new EventEmitterRealtimePublisher());

    await service.loadDataset(StaticFixtureDataset.demo());
    const firstBootstrap = await service.getBootstrap();
    await service.loadDataset(StaticFixtureDataset.demo());
    const secondBootstrap = await service.getBootstrap();

    expect(secondBootstrap).toEqual(firstBootstrap);
    expect(firstBootstrap.sensors).toHaveLength(18);
  });

  it("ingests detections and creates chorus spike alerts", async () => {
    const service = new CicadaSenseService(
      new InMemoryCicadaRepository(),
      new EventEmitterRealtimePublisher(),
      undefined,
      () => new Date("2026-05-29T10:05:00.000Z"),
    );
    await service.loadDataset(StaticFixtureDataset.demo());

    const result = await service.ingestDetection({
      organizationId: "org-cicada-lab",
      projectId: "project-provence-2026",
      siteId: "site-sainte-victoire",
      sensorId: "sensor-site-sainte-victoire-1",
      speciesId: "species-lyristes-plebejus",
      confidence: 0.91,
      intensity: 96,
      recordedAt: "2026-05-29T10:05:00.000Z",
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.kind).toBe("chorus_spike");
  });

  it("ingests detections and creates abnormal silence alerts", async () => {
    const service = new CicadaSenseService(
      new InMemoryCicadaRepository(),
      new EventEmitterRealtimePublisher(),
      undefined,
      () => new Date("2026-05-29T10:06:00.000Z"),
    );
    await service.loadDataset(StaticFixtureDataset.demo());

    const result = await service.ingestDetection({
      organizationId: "org-cicada-lab",
      projectId: "project-provence-2026",
      siteId: "site-sainte-victoire",
      sensorId: "sensor-site-sainte-victoire-1",
      speciesId: "species-lyristes-plebejus",
      confidence: 0.9,
      intensity: 12,
      recordedAt: "2026-05-29T10:06:00.000Z",
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.kind).toBe("abnormal_silence");
  });

  it("ingests detections and creates habitat risk alerts on fragile sites", async () => {
    const service = new CicadaSenseService(
      new InMemoryCicadaRepository(),
      new EventEmitterRealtimePublisher(),
      undefined,
      () => new Date("2026-05-29T10:07:00.000Z"),
    );
    await service.loadDataset(StaticFixtureDataset.demo());

    const result = await service.ingestDetection({
      organizationId: "org-cicada-lab",
      projectId: "project-provence-2026",
      siteId: "site-calanques",
      sensorId: "sensor-site-calanques-1",
      speciesId: "species-cicada-orni",
      confidence: 0.84,
      intensity: 81,
      recordedAt: "2026-05-29T10:07:00.000Z",
    });

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.kind).toBe("habitat_risk");
  });

  it("marks sources stale with frozen time", async () => {
    const service = new CicadaSenseService(new InMemoryCicadaRepository(), new EventEmitterRealtimePublisher());
    await service.loadDataset(StaticFixtureDataset.demo());

    const health = await service.computeSourceFreshness(new Date("2026-05-29T10:10:00.000Z"));
    const bootstrap = await service.getBootstrap();

    expect(health.find((entry) => entry.sourceId === "sensor-site-sainte-victoire-1")?.status).toBe("stale");
    expect(bootstrap.alerts.some((alert) => alert.kind === "stale_source")).toBe(true);
  });

  it("marks outage-like sources and suppresses duplicate alerts", async () => {
    const service = new CicadaSenseService(new InMemoryCicadaRepository(), new EventEmitterRealtimePublisher());
    await service.loadDataset(StaticFixtureDataset.demo());

    await service.loadDataset({
      ...(await service.getBootstrap()),
      sourceHealth: [
        SourceHealth.create({
          sourceId: "sensor-site-sainte-victoire-1",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          status: "active",
          lastSeenAt: "2026-05-29T10:00:00.000Z",
          expectedIntervalSeconds: 60,
          failureCount: 2,
        }),
      ],
    });

    await service.computeSourceFreshness(new Date("2026-05-29T10:01:00.000Z"));
    await service.computeSourceFreshness(new Date("2026-05-29T10:02:00.000Z"));
    const bootstrap = await service.getBootstrap();

    expect(
      bootstrap.alerts.filter((alert) => alert.kind === "sensor_outage" && alert.siteId === "site-sainte-victoire"),
    ).toHaveLength(1);
  });
});
