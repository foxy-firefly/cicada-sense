import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { Server as SocketServer } from "socket.io";
import type { CicadaSenseService, DetectionInput } from "../../application/cicada-sense-service.js";
import type { Alert, Detection } from "../../domain/model.js";
import { DomainErrorMapper } from "./domain-error-mapper.js";

interface JsonResponse {
  readonly statusCode: number;
  readonly body: unknown;
}

export class CicadaHttpServer {
  private readonly server: Server;
  private readonly socketServer: SocketServer;

  public constructor(private readonly cicadaSenseService: CicadaSenseService) {
    this.server = createServer((request, response) => {
      this.route(request, response).catch((error: unknown) => this.sendError(response, error));
    });
    this.socketServer = new SocketServer(this.server, {
      cors: { origin: true },
    });
    this.configureSockets();
  }

  public listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, resolve);
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socketServer.close();
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
    const address = this.server.address();
    if (!address || typeof address === "string") {
      return "http://127.0.0.1:0";
    }
    return `http://127.0.0.1:${address.port}`;
  }

  public publishDetection(detection: Detection): void {
    this.socketServer.to(`organization:${detection.organizationId}`).emit("detection:created", detection);
    this.socketServer.to(`project:${detection.projectId}`).emit("detection:created", detection);
    this.socketServer.to(`site:${detection.siteId}`).emit("detection:created", detection);
  }

  public publishAlert(alert: Alert): void {
    this.socketServer.to(`project:${alert.projectId}`).emit("alert:created", alert);
    this.socketServer.to(`site:${alert.siteId}`).emit("alert:created", alert);
  }

  private configureSockets(): void {
    this.socketServer.on("connection", (socket) => {
      socket.on("join:organization", (organizationId: string) => socket.join(`organization:${organizationId}`));
      socket.on("join:project", (projectId: string) => socket.join(`project:${projectId}`));
      socket.on("join:site", (siteId: string) => socket.join(`site:${siteId}`));
    });
  }

  private async route(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (request.method === "OPTIONS") {
      this.send(response, { statusCode: 204, body: null });
      return;
    }

    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const result = await this.handleRoute(request, pathname);
    this.send(response, result);
  }

  private async handleRoute(request: IncomingMessage, pathname: string): Promise<JsonResponse> {
    if (request.method === "GET" && (pathname === "/health" || pathname === "/api/health/live")) {
      const bootstrap = await this.cicadaSenseService.getBootstrap();
      return {
        statusCode: 200,
        body: { status: "ok", sources: bootstrap.sourceHealth.length },
      };
    }

    if (request.method === "GET" && pathname === "/api/bootstrap") {
      return {
        statusCode: 200,
        body: await this.cicadaSenseService.getBootstrap(),
      };
    }

    if (request.method === "GET" && pathname === "/api/source-health") {
      return {
        statusCode: 200,
        body: await this.cicadaSenseService.computeSourceFreshness(),
      };
    }

    if (request.method === "POST" && pathname === "/api/ingest/detections") {
      const input = (await this.readJson(request)) as DetectionInput;
      return {
        statusCode: 202,
        body: await this.cicadaSenseService.ingestDetection(input),
      };
    }

    return { statusCode: 404, body: { error: "NOT_FOUND" } };
  }

  private readJson(request: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("error", reject);
      request.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private send(response: ServerResponse, result: JsonResponse): void {
    response.writeHead(result.statusCode, {
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(result.statusCode === 204 ? undefined : JSON.stringify(result.body));
  }

  private sendError(response: ServerResponse, error: unknown): void {
    this.send(response, DomainErrorMapper.toHttpResponse(error));
  }
}
