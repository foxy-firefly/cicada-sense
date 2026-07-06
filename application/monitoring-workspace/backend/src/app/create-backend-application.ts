import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { CicadaSenseService } from "../application/cicada-sense-service.js";
import { StaticFixtureDataset } from "../fixtures/static-fixtures.js";
import { EventEmitterRealtimePublisher } from "../infrastructure/event-emitter-realtime-publisher.js";
import { InMemoryCicadaRepository } from "../infrastructure/in-memory-cicada-repository.js";
import { InMemorySourceFreshnessRuntime } from "../infrastructure/in-memory-source-freshness-runtime.js";
import { BackendObservability } from "../infrastructure/observability.js";
import { RedisSourceFreshnessRuntime } from "../infrastructure/redis-source-freshness-runtime.js";
import { BackendSecurity, type BackendSecurityOptions } from "../infrastructure/security.js";
import { RealtimeSocketBridge } from "../presentation/realtime/realtime-socket-bridge.js";
import { BackendModule } from "./backend.module.js";
import { BackendNestApplication } from "./backend-nest-application.js";

interface BackendApplicationOptions {
  readonly observability?: BackendObservability;
  readonly security?: BackendSecurityOptions;
}

interface HttpRequestLike {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  socket: {
    remoteAddress?: string;
  };
  url?: string;
}

interface HttpResponseLike {
  end(): void;
  json(body: unknown): void;
  on(event: "finish", listener: () => void): void;
  setHeader(name: string, value: string): void;
  status(code: number): HttpResponseLike;
  statusCode: number;
}

export class BackendApplicationFactory {
  public static async create(options: BackendApplicationOptions = {}): Promise<BackendNestApplication> {
    const repository = new InMemoryCicadaRepository();
    const observability = options.observability ?? new BackendObservability();
    const security = new BackendSecurity(options.security);
    const publisher = new EventEmitterRealtimePublisher();
    const sourceFreshnessRuntime = process.env.REDIS_URL
      ? new RedisSourceFreshnessRuntime(process.env.REDIS_URL)
      : new InMemorySourceFreshnessRuntime();
    const service = new CicadaSenseService(repository, publisher, sourceFreshnessRuntime);
    await service.loadDataset(StaticFixtureDataset.demo());

    const app = await NestFactory.create(BackendModule.register(service, observability), {
      logger: false,
    });
    app.use((request: HttpRequestLike, response: HttpResponseLike, next: () => void) => {
      const startedAt = process.hrtime.bigint();
      const requestId = observability.createRequestId(request.headers["x-request-id"]);
      const pathname = request.originalUrl ?? request.url ?? "/";
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : undefined;

      request.headers["x-request-id"] = requestId;
      response.setHeader("x-request-id", requestId);
      if (origin && security.isOriginAllowed(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Headers", security.allowHeaders());
        response.setHeader("Access-Control-Allow-Methods", security.allowMethods());
      }
      response.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        observability.recordHttpRequest({
          durationMs,
          method: request.method ?? "UNKNOWN",
          path: pathname,
          requestId,
          statusCode: response.statusCode,
        });
      });

      if (origin && !security.isOriginAllowed(origin)) {
        response.status(403).json({ error: "DISALLOWED_ORIGIN" });
        return;
      }

      if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
      }

      if (security.isRateLimited(request.socket.remoteAddress ?? "unknown", pathname)) {
        response.status(429).json({ error: "RATE_LIMITED" });
        return;
      }

      next();
    });

    const realtimeSocketBridge = app.get(RealtimeSocketBridge);
    realtimeSocketBridge.attach(app.getHttpServer());

    publisher.events.on("detection:created", (detection) => realtimeSocketBridge.publishDetection(detection));
    publisher.events.on("alert:created", (alert) => realtimeSocketBridge.publishAlert(alert));

    return new BackendNestApplication(app, realtimeSocketBridge);
  }
}
