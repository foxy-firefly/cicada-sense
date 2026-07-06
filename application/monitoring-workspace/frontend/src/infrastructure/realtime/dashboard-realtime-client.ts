import { io, type Socket } from "socket.io-client";
import type { Alert, Detection } from "../../domain/model.js";

export class DashboardRealtimeClient {
  private socket: Socket | null = null;

  public connect(
    projectId: string,
    onDetection: (detection: Detection) => void,
    onAlert: (alert: Alert) => void,
  ): () => void {
    this.socket = io({ path: "/socket.io" });
    this.socket.emit("join:project", projectId);
    this.socket.on("detection:created", onDetection);
    this.socket.on("alert:created", onAlert);

    return () => {
      this.socket?.disconnect();
      this.socket = null;
    };
  }
}
