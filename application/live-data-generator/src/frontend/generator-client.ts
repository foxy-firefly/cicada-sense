import type { FailureInjection, PlaybackCommand, PlaybackSpeed, PlaybackState, Scenario } from "../shared/contracts.js";

export class GeneratorClient {
  public async listScenarios(): Promise<Scenario[]> {
    return (await this.fetchJson("/api/scenarios")) as Scenario[];
  }

  public async start(command: PlaybackCommand): Promise<PlaybackState> {
    return (await this.fetchJson("/api/playback/start", {
      body: JSON.stringify(command),
      headers: { "content-type": "application/json" },
      method: "POST",
    })) as PlaybackState;
  }

  public async pause(): Promise<PlaybackState> {
    return (await this.fetchJson("/api/playback/pause", { method: "POST" })) as PlaybackState;
  }

  public async setSpeed(command: PlaybackSpeed): Promise<PlaybackState> {
    return (await this.fetchJson("/api/playback/speed", {
      body: JSON.stringify(command),
      headers: { "content-type": "application/json" },
      method: "POST",
    })) as PlaybackState;
  }

  public async stop(): Promise<PlaybackState> {
    return (await this.fetchJson("/api/playback/stop", { method: "POST" })) as PlaybackState;
  }

  public async injectFailure(command: FailureInjection): Promise<PlaybackState> {
    return (await this.fetchJson("/api/playback/failures", {
      body: JSON.stringify(command),
      headers: { "content-type": "application/json" },
      method: "POST",
    })) as PlaybackState;
  }

  private async fetchJson(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(path, init);
    if (!response.ok) {
      throw new Error(`GENERATOR_REQUEST_FAILED:${response.status}`);
    }

    return response.json();
  }
}
