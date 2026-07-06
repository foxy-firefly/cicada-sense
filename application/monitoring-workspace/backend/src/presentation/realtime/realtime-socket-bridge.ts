import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import type { Alert, Detection } from "../../domain/model.js";

export class RealtimeSocketBridge {
  private socketServer: SocketServer | null = null;

  public attach(server: HttpServer): void {
    this.socketServer = new SocketServer(server, {
      cors: { origin: true },
    });

    this.socketServer.on("connection", (socket) => {
      socket.on("join:organization", (organizationId: string) => socket.join(`organization:${organizationId}`));
      socket.on("join:project", (projectId: string) => socket.join(`project:${projectId}`));
      socket.on("join:site", (siteId: string) => socket.join(`site:${siteId}`));
    });
  }

  public close(): void {
    this.socketServer?.close();
    this.socketServer = null;
  }

  public publishDetection(detection: Detection): void {
    this.socketServer?.to(`organization:${detection.organizationId}`).emit("detection:created", detection);
    this.socketServer?.to(`project:${detection.projectId}`).emit("detection:created", detection);
    this.socketServer?.to(`site:${detection.siteId}`).emit("detection:created", detection);
  }

  public publishAlert(alert: Alert): void {
    this.socketServer?.to(`project:${alert.projectId}`).emit("alert:created", alert);
    this.socketServer?.to(`site:${alert.siteId}`).emit("alert:created", alert);
  }
}
