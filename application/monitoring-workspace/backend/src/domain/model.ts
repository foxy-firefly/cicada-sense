import { DomainError, ErrorCode } from "./error-codes.js";

export type SourceStatus = "active" | "stale" | "cooldown" | "disabled" | "error";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertKind = "chorus_spike" | "abnormal_silence" | "sensor_outage" | "stale_source" | "habitat_risk";

export interface CoordinatesProps {
  readonly latitude: number;
  readonly longitude: number;
}

type CoordinatesInput = Coordinates | CoordinatesProps;

export interface OrganizationProps {
  readonly id: string;
  readonly name: string;
}

export interface ProjectProps {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
}

export interface SiteProps {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly name: string;
  readonly coordinates: Coordinates | CoordinatesProps;
  readonly habitatScore: number;
}

export interface SensorProps {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly name: string;
  readonly coordinates: Coordinates | CoordinatesProps;
  readonly status: SourceStatus;
  readonly expectedIntervalSeconds: number;
}

export interface SpeciesProps {
  readonly id: string;
  readonly scientificName: string;
  readonly commonName: string;
}

export interface DetectionProps {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly sensorId: string;
  readonly speciesId: string;
  readonly confidence: number;
  readonly intensity: number;
  readonly recordedAt: string;
}

export interface SourceHealthProps {
  readonly sourceId: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly status: SourceStatus;
  readonly lastSeenAt: string | null;
  readonly expectedIntervalSeconds: number;
  readonly failureCount: number;
}

export interface AlertProps {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly severity: AlertSeverity;
  readonly kind: AlertKind;
  readonly message: string;
  readonly createdAt: string;
}

export class Coordinates {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {}

  public static create(input: CoordinatesInput): Coordinates {
    if (input instanceof Coordinates) {
      return input;
    }

    DomainValidator.assertCoordinates(input);
    return new Coordinates(input.latitude, input.longitude);
  }
}

export class Organization {
  private constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  public static create(input: OrganizationProps): Organization {
    DomainValidator.assertNonEmptyString(input.id, "organization.id");
    DomainValidator.assertNonEmptyString(input.name, "organization.name");
    return new Organization(input.id, input.name);
  }
}

export class Project {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string,
  ) {}

  public static create(input: ProjectProps): Project {
    DomainValidator.assertNonEmptyString(input.id, "project.id");
    DomainValidator.assertNonEmptyString(input.organizationId, "project.organizationId");
    DomainValidator.assertNonEmptyString(input.name, "project.name");
    return new Project(input.id, input.organizationId, input.name);
  }
}

export class Site {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly coordinates: Coordinates,
    public readonly habitatScore: number,
  ) {}

  public static create(input: SiteProps): Site {
    DomainValidator.assertNonEmptyString(input.id, "site.id");
    DomainValidator.assertNonEmptyString(input.organizationId, "site.organizationId");
    DomainValidator.assertNonEmptyString(input.projectId, "site.projectId");
    DomainValidator.assertNonEmptyString(input.name, "site.name");
    return new Site(
      input.id,
      input.organizationId,
      input.projectId,
      input.name,
      Coordinates.create(input.coordinates),
      input.habitatScore,
    );
  }
}

export class Sensor {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly siteId: string,
    public readonly name: string,
    public readonly coordinates: Coordinates,
    public readonly status: SourceStatus,
    public readonly expectedIntervalSeconds: number,
  ) {}

  public static create(input: SensorProps): Sensor {
    DomainValidator.assertNonEmptyString(input.id, "sensor.id");
    DomainValidator.assertNonEmptyString(input.organizationId, "sensor.organizationId");
    DomainValidator.assertNonEmptyString(input.projectId, "sensor.projectId");
    DomainValidator.assertNonEmptyString(input.siteId, "sensor.siteId");
    DomainValidator.assertNonEmptyString(input.name, "sensor.name");
    return new Sensor(
      input.id,
      input.organizationId,
      input.projectId,
      input.siteId,
      input.name,
      Coordinates.create(input.coordinates),
      input.status,
      input.expectedIntervalSeconds,
    );
  }
}

export class Species {
  private constructor(
    public readonly id: string,
    public readonly scientificName: string,
    public readonly commonName: string,
  ) {}

  public static create(input: SpeciesProps): Species {
    DomainValidator.assertNonEmptyString(input.id, "species.id");
    DomainValidator.assertNonEmptyString(input.scientificName, "species.scientificName");
    DomainValidator.assertNonEmptyString(input.commonName, "species.commonName");
    return new Species(input.id, input.scientificName, input.commonName);
  }
}

export class Detection {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly siteId: string,
    public readonly sensorId: string,
    public readonly speciesId: string,
    public readonly confidence: number,
    public readonly intensity: number,
    public readonly recordedAt: string,
  ) {}

  public static create(input: DetectionProps): Detection {
    DomainValidator.assertNonEmptyString(input.id, "detection.id");
    DomainValidator.assertNonEmptyString(input.organizationId, "detection.organizationId");
    DomainValidator.assertNonEmptyString(input.projectId, "detection.projectId");
    DomainValidator.assertNonEmptyString(input.siteId, "detection.siteId");
    DomainValidator.assertNonEmptyString(input.sensorId, "detection.sensorId");
    DomainValidator.assertNonEmptyString(input.speciesId, "detection.speciesId");
    DomainValidator.assertConfidence(input.confidence);
    return new Detection(
      input.id,
      input.organizationId,
      input.projectId,
      input.siteId,
      input.sensorId,
      input.speciesId,
      input.confidence,
      input.intensity,
      input.recordedAt,
    );
  }
}

export class SourceHealth {
  private constructor(
    public readonly sourceId: string,
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly siteId: string,
    public readonly status: SourceStatus,
    public readonly lastSeenAt: string | null,
    public readonly expectedIntervalSeconds: number,
    public readonly failureCount: number,
  ) {}

  public static create(input: SourceHealthProps): SourceHealth {
    DomainValidator.assertNonEmptyString(input.sourceId, "sourceHealth.sourceId");
    DomainValidator.assertNonEmptyString(input.organizationId, "sourceHealth.organizationId");
    DomainValidator.assertNonEmptyString(input.projectId, "sourceHealth.projectId");
    DomainValidator.assertNonEmptyString(input.siteId, "sourceHealth.siteId");
    return new SourceHealth(
      input.sourceId,
      input.organizationId,
      input.projectId,
      input.siteId,
      input.status,
      input.lastSeenAt,
      input.expectedIntervalSeconds,
      input.failureCount,
    );
  }
}

export class Alert {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly projectId: string,
    public readonly siteId: string,
    public readonly severity: AlertSeverity,
    public readonly kind: AlertKind,
    public readonly message: string,
    public readonly createdAt: string,
  ) {}

  public static create(input: AlertProps): Alert {
    DomainValidator.assertNonEmptyString(input.id, "alert.id");
    DomainValidator.assertNonEmptyString(input.organizationId, "alert.organizationId");
    DomainValidator.assertNonEmptyString(input.projectId, "alert.projectId");
    DomainValidator.assertNonEmptyString(input.siteId, "alert.siteId");
    DomainValidator.assertNonEmptyString(input.message, "alert.message");
    return new Alert(
      input.id,
      input.organizationId,
      input.projectId,
      input.siteId,
      input.severity,
      input.kind,
      input.message,
      input.createdAt,
    );
  }
}

export interface CicadaDataset {
  readonly organizations: readonly Organization[];
  readonly projects: readonly Project[];
  readonly sites: readonly Site[];
  readonly sensors: readonly Sensor[];
  readonly species: readonly Species[];
  readonly detections: readonly Detection[];
  readonly sourceHealth: readonly SourceHealth[];
  readonly alerts: readonly Alert[];
}

export class DomainValidator {
  public static assertNonEmptyString(value: string, fieldName: string): void {
    if (value.trim().length === 0) {
      throw new DomainError(ErrorCode.InvalidDomainObject, `${fieldName} must not be empty`);
    }
  }

  public static assertCoordinates(coordinates: CoordinatesInput): void {
    if (
      coordinates.latitude < -90 ||
      coordinates.latitude > 90 ||
      coordinates.longitude < -180 ||
      coordinates.longitude > 180
    ) {
      throw new DomainError(ErrorCode.InvalidCoordinates);
    }
  }

  public static assertConfidence(confidence: number): void {
    if (confidence < 0 || confidence > 1) {
      throw new DomainError(ErrorCode.InvalidDetectionConfidence);
    }
  }

  public static assertDataset(dataset: CicadaDataset): void {
    for (const site of dataset.sites) {
      Coordinates.create(site.coordinates);
    }

    for (const sensor of dataset.sensors) {
      Coordinates.create(sensor.coordinates);
    }

    for (const detection of dataset.detections) {
      DomainValidator.assertConfidence(detection.confidence);
    }
  }
}
