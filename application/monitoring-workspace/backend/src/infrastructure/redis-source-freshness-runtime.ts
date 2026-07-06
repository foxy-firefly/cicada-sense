import { createClient, type RedisClientType } from "redis";
import type { SourceFreshnessRuntime } from "../application/ports.js";
import { SourceHealth } from "../domain/model.js";

const REDIS_SOURCE_FRESHNESS_KEY = "cicada-sense:source-health";

export class RedisSourceFreshnessRuntime implements SourceFreshnessRuntime {
  private readonly client: RedisClientType;

  public constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
  }

  public async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async listSourceHealth(): Promise<SourceHealth[]> {
    await this.connect();
    const entries = await this.client.hGetAll(REDIS_SOURCE_FRESHNESS_KEY);
    return Object.values(entries as Record<string, string>)
      .map((value) => JSON.parse(value) as Parameters<typeof SourceHealth.create>[0])
      .map((value) => SourceHealth.create(value));
  }

  public async saveSourceHealth(sourceHealth: SourceHealth): Promise<void> {
    await this.connect();
    await this.client.hSet(REDIS_SOURCE_FRESHNESS_KEY, sourceHealth.sourceId, JSON.stringify(sourceHealth));
  }
}
