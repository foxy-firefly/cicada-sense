import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import type { RealtimeSocketBridge } from "../presentation/realtime/realtime-socket-bridge.js";

export class BackendNestApplication {
  public constructor(
    private readonly app: INestApplication,
    private readonly realtimeSocketBridge: RealtimeSocketBridge,
  ) {}

  public async listen(port: number): Promise<void> {
    await this.app.listen(port);
  }

  public async close(): Promise<void> {
    this.realtimeSocketBridge.close();
    await this.app.close();
  }

  public address(): string {
    const serverAddress = this.app.getHttpServer().address() as AddressInfo | string | null;
    if (!serverAddress || typeof serverAddress === "string") {
      return "http://127.0.0.1:0";
    }

    return `http://127.0.0.1:${serverAddress.port}`;
  }
}
