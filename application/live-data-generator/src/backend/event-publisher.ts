import type { GeneratedEvent } from "../shared/contracts.js";
import type { GeneratorObservability } from "./observability.js";

export class BackendEventPublisher {
  public constructor(
    private readonly backendBaseUrl: string,
    private readonly observability?: GeneratorObservability,
  ) {}

  public async publish(event: GeneratedEvent, requestId?: string): Promise<void> {
    const response = await fetch(`${this.backendBaseUrl}/api/ingest/detections`, {
      body: JSON.stringify(event),
      headers: {
        "content-type": "application/json",
        "x-organization-id": event.organizationId,
        ...(requestId ? { "x-request-id": requestId } : {}),
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("LIVE_GENERATOR_PUBLISH_FAILED");
    }

    if (requestId) {
      this.observability?.recordPublishedEvent(requestId, event);
    }
  }
}
