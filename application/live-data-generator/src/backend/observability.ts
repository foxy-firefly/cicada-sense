import { randomUUID } from "node:crypto";
import type { GeneratedEvent, PlaybackState } from "../shared/contracts.js";

export interface StructuredLogEntry {
  readonly durationMs?: number;
  readonly event: string;
  readonly level: "error" | "info";
  readonly method?: string;
  readonly path?: string;
  readonly requestId?: string;
  readonly scenarioId?: string | null;
  readonly sensorId?: string;
  readonly service: string;
  readonly statusCode?: number;
  readonly timestamp: string;
}

export interface StructuredLogger {
  log(entry: StructuredLogEntry): void;
}

export class ConsoleStructuredLogger implements StructuredLogger {
  public log(entry: StructuredLogEntry): void {
    console.log(JSON.stringify(entry));
  }
}

const GENERATOR_SERVICE_NAME = "live-data-generator";

export class GeneratorObservability {
  private readonly requestsByPath = new Map<string, number>();
  private readonly requestsByStatusCode = new Map<string, number>();
  private readonly startedAt: number;
  private publishedEvents = 0;
  private requestsTotal = 0;

  public constructor(
    private readonly logger: StructuredLogger = new ConsoleStructuredLogger(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.startedAt = this.now().getTime();
  }

  public createRequestId(headerValue?: string | string[]): string {
    if (typeof headerValue === "string" && headerValue.length > 0) {
      return headerValue;
    }

    if (Array.isArray(headerValue) && headerValue[0]) {
      return headerValue[0];
    }

    return randomUUID();
  }

  public health(playbackState: PlaybackState) {
    return {
      currentScenarioId: playbackState.currentScenarioId,
      isPlaying: playbackState.isPlaying,
      publishedEvents: this.publishedEvents,
      requestsTotal: this.requestsTotal,
      service: GENERATOR_SERVICE_NAME,
      status: "ok",
      uptimeSeconds: this.uptimeSeconds(),
    };
  }

  public metrics() {
    return {
      publishedEvents: this.publishedEvents,
      requestsByPath: Object.fromEntries(this.requestsByPath),
      requestsByStatusCode: Object.fromEntries(this.requestsByStatusCode),
      requestsTotal: this.requestsTotal,
      service: GENERATOR_SERVICE_NAME,
      uptimeSeconds: this.uptimeSeconds(),
    };
  }

  public recordHttpRequest(input: {
    readonly durationMs: number;
    readonly method: string;
    readonly path: string;
    readonly requestId: string;
    readonly statusCode: number;
  }): void {
    this.requestsTotal += 1;
    this.increment(this.requestsByPath, input.path);
    this.increment(this.requestsByStatusCode, String(input.statusCode));
    this.logger.log({
      durationMs: Number(input.durationMs.toFixed(2)),
      event: "http.request.completed",
      level: input.statusCode >= 500 ? "error" : "info",
      method: input.method,
      path: input.path,
      requestId: input.requestId,
      service: GENERATOR_SERVICE_NAME,
      statusCode: input.statusCode,
      timestamp: this.now().toISOString(),
    });
  }

  public recordPublishedEvent(requestId: string, event: GeneratedEvent): void {
    this.publishedEvents += 1;
    this.logger.log({
      event: "generator.event.published",
      level: "info",
      requestId,
      scenarioId: null,
      sensorId: event.sensorId,
      service: GENERATOR_SERVICE_NAME,
      timestamp: this.now().toISOString(),
    });
  }

  private increment(bucket: Map<string, number>, key: string): void {
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }

  private uptimeSeconds(): number {
    return Number(((this.now().getTime() - this.startedAt) / 1000).toFixed(3));
  }
}
