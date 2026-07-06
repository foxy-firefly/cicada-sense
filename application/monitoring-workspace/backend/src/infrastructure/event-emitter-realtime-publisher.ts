import { EventEmitter } from "node:events";
import type { RealtimePublisher } from "../application/ports.js";
import type { Alert, Detection } from "../domain/model.js";

export class EventEmitterRealtimePublisher implements RealtimePublisher {
  public readonly events = new EventEmitter();

  public publishDetection(detection: Detection): void {
    this.events.emit("detection:created", detection);
  }

  public publishAlert(alert: Alert): void {
    this.events.emit("alert:created", alert);
  }
}
