import { describe, expect, it } from "vitest";
import { CicadaSenseService } from "../application/cicada-sense-service.js";
import { SourceHealth } from "../domain/model.js";
import { StaticFixtureDataset } from "../fixtures/static-fixtures.js";
import { EventEmitterRealtimePublisher } from "./event-emitter-realtime-publisher.js";
import { InMemoryCicadaRepository } from "./in-memory-cicada-repository.js";
import { RedisSourceFreshnessRuntime } from "./redis-source-freshness-runtime.js";

const redisDescribe = process.env.REDIS_URL ? describe : describe.skip;

redisDescribe("RedisSourceFreshnessRuntime", () => {
  const runtime = new RedisSourceFreshnessRuntime(process.env.REDIS_URL ?? "");

  it("stores source freshness in redis and reads it back through the application port", async () => {
    const repository = new InMemoryCicadaRepository();
    const service = new CicadaSenseService(repository, new EventEmitterRealtimePublisher(), runtime);
    const dataset = StaticFixtureDataset.demo();

    await repository.loadDataset(dataset);
    await service.computeSourceFreshness(new Date("2026-05-29T10:10:00.000Z"));

    await repository.loadDataset({
      ...dataset,
      sourceHealth: [
        SourceHealth.create({
          sourceId: "sensor-ridge-01",
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          status: "active",
          lastSeenAt: null,
          expectedIntervalSeconds: 60,
          failureCount: 0,
        }),
      ],
    });

    const coordinatedSourceHealth = await service.listSourceHealth();

    expect(coordinatedSourceHealth.some((entry) => entry.status === "stale")).toBe(true);
  });
});
