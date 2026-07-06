import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { GeneratorObservability } from "./observability.js";
import type { PlaybackService } from "./playback-service.js";
import { GeneratorSecurity } from "./security.js";

export class GeneratorHttpServer {
  private readonly server: Server;

  public constructor(
    private readonly playbackService: PlaybackService,
    private readonly observability: GeneratorObservability = new GeneratorObservability(),
    private readonly security: GeneratorSecurity = new GeneratorSecurity(),
  ) {
    this.server = createServer((request, response) => {
      const startedAt = process.hrtime.bigint();
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const requestId = this.observability.createRequestId(request.headers["x-request-id"]);
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : undefined;

      request.headers["x-request-id"] = requestId;
      response.setHeader("x-request-id", requestId);
      if (origin && this.security.isOriginAllowed(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Headers", this.security.allowHeaders());
        response.setHeader("Access-Control-Allow-Methods", this.security.allowMethods());
      }
      response.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        this.observability.recordHttpRequest({
          durationMs,
          method: request.method ?? "UNKNOWN",
          path: pathname,
          requestId,
          statusCode: response.statusCode,
        });
      });

      if (origin && !this.security.isOriginAllowed(origin)) {
        this.send(response, 403, { error: "DISALLOWED_ORIGIN" });
        return;
      }

      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "Access-Control-Allow-Headers": this.security.allowHeaders(),
          "Access-Control-Allow-Methods": this.security.allowMethods(),
          ...(origin && this.security.isOriginAllowed(origin)
            ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
            : {}),
        });
        response.end();
        return;
      }

      if (this.security.isRateLimited(request.socket.remoteAddress ?? "unknown", pathname)) {
        this.send(response, 429, { error: "RATE_LIMITED" });
        return;
      }

      this.route(request, response, pathname, requestId).catch(() =>
        this.send(response, 500, { error: "INTERNAL_SERVER_ERROR" }),
      );
    });
  }

  public listen(port: number): Promise<void> {
    return new Promise((resolve) => this.server.listen(port, resolve));
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public address(): string {
    const address = this.server.address() as AddressInfo | string | null;
    if (!address || typeof address === "string") {
      return "http://127.0.0.1:0";
    }

    return `http://127.0.0.1:${address.port}`;
  }

  private async route(
    request: IncomingMessage,
    response: ServerResponse,
    pathname: string,
    requestId: string,
  ): Promise<void> {
    if (request.method === "GET" && (pathname === "/health" || pathname === "/api/health/live")) {
      this.send(response, 200, this.observability.health(this.playbackService.getState()));
      return;
    }

    if (request.method === "GET" && pathname === "/metrics") {
      this.send(response, 200, this.observability.metrics());
      return;
    }

    if (request.method === "GET" && pathname === "/api/scenarios") {
      this.send(response, 200, this.playbackService.listScenarios());
      return;
    }

    if (request.method === "GET" && pathname === "/api/playback") {
      this.send(response, 200, this.playbackService.getState());
      return;
    }

    if (request.method === "POST" && pathname === "/api/playback/start") {
      this.send(response, 202, await this.playbackService.start(await this.readJson(request), requestId));
      return;
    }

    if (request.method === "POST" && pathname === "/api/playback/pause") {
      this.send(response, 200, this.playbackService.pause());
      return;
    }

    if (request.method === "POST" && pathname === "/api/playback/stop") {
      this.send(response, 200, this.playbackService.stop());
      return;
    }

    if (request.method === "POST" && pathname === "/api/playback/speed") {
      this.send(response, 200, this.playbackService.setSpeed(await this.readJson(request)));
      return;
    }

    if (request.method === "POST" && pathname === "/api/playback/failures") {
      this.send(response, 200, await this.playbackService.injectFailure(await this.readJson(request), requestId));
      return;
    }

    this.send(response, 404, { error: "NOT_FOUND" });
  }

  private readJson(request: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("error", reject);
      request.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
    });
  }

  private send(response: ServerResponse, statusCode: number, body: unknown): void {
    response.writeHead(statusCode, {
      "Access-Control-Allow-Headers": this.security.allowHeaders(),
      "Access-Control-Allow-Methods": this.security.allowMethods(),
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(body));
  }
}
