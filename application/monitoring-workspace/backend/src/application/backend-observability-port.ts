export const BACKEND_OBSERVABILITY = Symbol("BACKEND_OBSERVABILITY");

export interface BackendObservabilityPort {
  health(sources: number): unknown;
  metrics(): unknown;
  recordDetectionIngested(requestId: string, sensorId: string): void;
}
