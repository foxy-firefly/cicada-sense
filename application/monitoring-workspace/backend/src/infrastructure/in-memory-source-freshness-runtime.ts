import type { SourceFreshnessRuntime } from "../application/ports.js";
import type { SourceHealth } from "../domain/model.js";

export class InMemorySourceFreshnessRuntime implements SourceFreshnessRuntime {
  private readonly sourceHealthEntries = new Map<string, SourceHealth>();

  public async listSourceHealth(): Promise<SourceHealth[]> {
    return [...this.sourceHealthEntries.values()];
  }

  public async saveSourceHealth(sourceHealth: SourceHealth): Promise<void> {
    this.sourceHealthEntries.set(sourceHealth.sourceId, sourceHealth);
  }
}
