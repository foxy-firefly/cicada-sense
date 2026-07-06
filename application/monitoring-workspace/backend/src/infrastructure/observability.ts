import { randomUUID } from "node:crypto";

export interface StructuredLogEntry {
  readonly durationMs?: number;
  readonly event: string;
  readonly level: "error" | "info";
  readonly method?: string;
  readonly path?: string;
  readonly requestId?: string;
  readonly sensorId?: string;
  readonly service: string;
  readonly sources?: number;
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

const BACKEND_SERVICE_NAME = "monitoring-backend";

export class BackendObservability {
  private readonly requestsByPath = new Map<string, number>();
  private readonly requestsByStatusCode = new Map<string, number>();
  private readonly startedAt: number;
  private detectionsIngested = 0;
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

  public health(sources: number) {
    return {
      service: BACKEND_SERVICE_NAME,
      sources,
      status: "ok",
      uptimeSeconds: this.uptimeSeconds(),
    };
  }

  public metrics() {
    return {
      detectionsIngested: this.detectionsIngested,
      requestsByPath: Object.fromEntries(this.requestsByPath),
      requestsByStatusCode: Object.fromEntries(this.requestsByStatusCode),
      requestsTotal: this.requestsTotal,
      service: BACKEND_SERVICE_NAME,
      uptimeSeconds: this.uptimeSeconds(),
    };
  }

  public recordDetectionIngested(requestId: string, sensorId: string): void {
    this.detectionsIngested += 1;
    this.logger.log({
      event: "detection.ingested",
      level: "info",
      requestId,
      sensorId,
      service: BACKEND_SERVICE_NAME,
      timestamp: this.now().toISOString(),
    });
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
      service: BACKEND_SERVICE_NAME,
      statusCode: input.statusCode,
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
