import {
  failureInjectionSchema,
  type GeneratedEvent,
  type PlaybackState,
  playbackCommandSchema,
  playbackSpeedSchema,
} from "../shared/contracts.js";
import { ScenarioRegistry } from "../shared/scenario-registry.js";
import type { BackendEventPublisher } from "./event-publisher.js";

export class PlaybackService {
  private state: PlaybackState = {
    currentScenarioId: null,
    emittedEvents: [],
    isPlaying: false,
    speed: 1,
  };

  public constructor(
    private readonly publisher: BackendEventPublisher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public listScenarios() {
    return ScenarioRegistry.list();
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public async start(commandInput: unknown, requestId?: string): Promise<PlaybackState> {
    const command = playbackCommandSchema.parse(commandInput);
    const scenario = ScenarioRegistry.get(command.scenarioId);
    if (!scenario) {
      throw new Error("SCENARIO_NOT_FOUND");
    }

    const emittedEvents = this.materializeScenarioEvents(scenario.events);

    this.state = {
      currentScenarioId: scenario.id,
      emittedEvents: [],
      isPlaying: true,
      speed: command.speed,
    };

    for (const event of emittedEvents) {
      if (!this.state.isPlaying) {
        break;
      }
      await this.publisher.publish(event, requestId);
      this.state = {
        ...this.state,
        emittedEvents: [...this.state.emittedEvents, event],
      };
    }

    this.state = { ...this.state, isPlaying: false };
    return this.state;
  }

  public pause(): PlaybackState {
    this.state = { ...this.state, isPlaying: false };
    return this.state;
  }

  public stop(): PlaybackState {
    this.state = {
      ...this.state,
      currentScenarioId: null,
      isPlaying: false,
    };

    return this.state;
  }

  public setSpeed(commandInput: unknown): PlaybackState {
    const { speed } = playbackSpeedSchema.parse(commandInput);
    this.state = {
      ...this.state,
      speed,
    };

    return this.state;
  }

  public async injectFailure(commandInput: unknown, requestId?: string): Promise<PlaybackState> {
    const command = failureInjectionSchema.parse(commandInput);
    const source = ScenarioRegistry.source(command.sourceId);
    const failureEvent: GeneratedEvent = {
      organizationId: "org-cicada-lab",
      projectId: "project-provence-2026",
      siteId: source?.siteId ?? "site-sainte-victoire",
      sensorId: command.sourceId,
      speciesId: source?.speciesId ?? "species-lyristes-plebejus",
      confidence: command.kind === "low_confidence" ? 0.18 : 0.32,
      intensity: command.kind === "outage" ? 0 : command.kind === "stale" ? 15 : 28,
      recordedAt: this.now().toISOString(),
    };

    await this.publisher.publish(failureEvent, requestId);

    this.state = {
      ...this.state,
      emittedEvents: [...this.state.emittedEvents, failureEvent],
    };
    return this.state;
  }

  private materializeScenarioEvents(events: readonly GeneratedEvent[]): GeneratedEvent[] {
    const referenceTimestamp = Date.parse(events[0]?.recordedAt ?? this.now().toISOString());
    const playbackStart = this.now().getTime();

    return events.map((event) => ({
      ...event,
      recordedAt: new Date(playbackStart + (Date.parse(event.recordedAt) - referenceTimestamp)).toISOString(),
    }));
  }
}
