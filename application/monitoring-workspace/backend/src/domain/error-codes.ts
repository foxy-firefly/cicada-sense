export enum ErrorCode {
  InvalidDomainObject = "INVALID_DOMAIN_OBJECT",
  InvalidCoordinates = "INVALID_COORDINATES",
  InvalidDetectionConfidence = "INVALID_DETECTION_CONFIDENCE",
  InvalidFixture = "INVALID_FIXTURE",
  InvalidIngestionPayload = "INVALID_INGESTION_PAYLOAD",
  NotFound = "NOT_FOUND",
  TenantMismatch = "TENANT_MISMATCH",
}

export class DomainError extends Error {
  public constructor(
    public readonly code: ErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
