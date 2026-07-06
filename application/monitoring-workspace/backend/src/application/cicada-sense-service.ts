import { createHash } from "node:crypto";
import { DomainError, ErrorCode } from "../domain/error-codes.js";
import { Alert, type CicadaDataset, Detection, DomainValidator, SourceHealth } from "../domain/model.js";
import type { CicadaRepository, RealtimePublisher, SourceFreshnessRuntime } from "./ports.js";

export interface DetectionInput {
  readonly organizationId: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly sensorId: string;
  readonly speciesId: string;
  readonly confidence: number;
  readonly intensity: number;
  readonly recordedAt: string;
}

export class CicadaSenseService {
  public constructor(
    private readonly repository: CicadaRepository,
    private readonly realtimePublisher: RealtimePublisher,
    private readonly sourceFreshnessRuntime?: SourceFreshnessRuntime,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async loadDataset(dataset: CicadaDataset): Promise<void> {
    DomainValidator.assertDataset(dataset);
    await this.repository.loadDataset(dataset);
  }

  public async getBootstrap() {
    const [organizations, projects, sites, sensors, species, detections, sourceHealth, alerts] = await Promise.all([
      this.repository.listOrganizations(),
      this.repository.listProjects(),
      this.repository.listSites(),
      this.repository.listSensors(),
      this.repository.listSpecies(),
      this.repository.listDetections(),
      this.repository.listSourceHealth(),
      this.repository.listAlerts(),
    ]);

    return {
      organizations,
      projects,
      sites,
      sensors,
      species,
      detections,
      sourceHealth,
      alerts,
    };
  }

  public async listOrganizations() {
    return this.repository.listOrganizations();
  }

  public async listProjects() {
    return this.repository.listProjects();
  }

  public async listSites() {
    return this.repository.listSites();
  }

  public async listSensors() {
    return this.repository.listSensors();
  }

  public async listSourceHealth() {
    if (this.sourceFreshnessRuntime) {
      const coordinatedSourceHealth = await this.sourceFreshnessRuntime.listSourceHealth();
      if (coordinatedSourceHealth.length > 0) {
        return coordinatedSourceHealth;
      }
    }

    return this.repository.listSourceHealth();
  }

  public async ingestDetection(input: DetectionInput): Promise<{
    detection: Detection;
    alerts: Alert[];
    sourceHealth: SourceHealth;
  }> {
    DomainValidator.assertConfidence(input.confidence);

    const detection = Detection.create({
      id: this.stableId([
        input.sensorId,
        input.speciesId,
        input.recordedAt,
        String(input.intensity),
        String(input.confidence),
      ]),
      ...input,
    });

    await this.repository.saveDetection(detection);
    const sourceHealth = await this.markSourceActive(detection);
    const alerts = await this.createAlerts(detection);

    this.realtimePublisher.publishDetection(detection);
    for (const alert of alerts) {
      this.realtimePublisher.publishAlert(alert);
    }

    return { detection, alerts, sourceHealth };
  }

  public async computeSourceFreshness(referenceDate = this.now()): Promise<SourceHealth[]> {
    const healthEntries = await this.repository.listSourceHealth();
    const updatedEntries: SourceHealth[] = [];

    for (const sourceHealth of healthEntries) {
      const updatedStatus = this.statusForSource(sourceHealth, referenceDate);
      const updatedHealth = SourceHealth.create({
        ...sourceHealth,
        status: updatedStatus,
      });
      await this.repository.saveSourceHealth(updatedHealth);
      await this.sourceFreshnessRuntime?.saveSourceHealth(updatedHealth);
      const freshnessAlerts = this.createFreshnessAlerts(updatedHealth);
      for (const alert of freshnessAlerts) {
        await this.repository.saveAlert(alert);
      }
      updatedEntries.push(updatedHealth);
    }

    return updatedEntries;
  }

  private async markSourceActive(detection: Detection): Promise<SourceHealth> {
    const sensors = await this.repository.listSensors();
    const sensor = sensors.find((currentSensor) => currentSensor.id === detection.sensorId);
    if (!sensor) {
      throw new DomainError(ErrorCode.NotFound, `Unknown sensor ${detection.sensorId}`);
    }

    const sourceHealth = SourceHealth.create({
      sourceId: detection.sensorId,
      organizationId: detection.organizationId,
      projectId: detection.projectId,
      siteId: detection.siteId,
      status: "active",
      lastSeenAt: detection.recordedAt,
      expectedIntervalSeconds: sensor.expectedIntervalSeconds,
      failureCount: 0,
    });

    await this.repository.saveSourceHealth(sourceHealth);
    await this.sourceFreshnessRuntime?.saveSourceHealth(sourceHealth);
    return sourceHealth;
  }

  private async createAlerts(detection: Detection): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const createdAt = this.now().toISOString();
    const sites = await this.repository.listSites();
    const site = sites.find((currentSite) => currentSite.id === detection.siteId);

    if (detection.intensity >= 90 && detection.confidence >= 0.8) {
      alerts.push(
        this.buildAlert(
          detection,
          "warning",
          "chorus_spike",
          "Chorus intensity exceeded the configured site baseline.",
          createdAt,
        ),
      );
    }

    if (detection.intensity <= 20 && detection.confidence >= 0.8) {
      alerts.push(
        this.buildAlert(
          detection,
          "warning",
          "abnormal_silence",
          "Detected activity dropped below the configured silence threshold.",
          createdAt,
        ),
      );
    }

    if (site && site.habitatScore < 70 && detection.intensity >= 80) {
      alerts.push(
        this.buildAlert(
          detection,
          "warning",
          "habitat_risk",
          "Habitat score is low for the current detected activity level.",
          createdAt,
        ),
      );
    }

    for (const alert of alerts) {
      await this.repository.saveAlert(alert);
    }

    return alerts;
  }

  private statusForSource(sourceHealth: SourceHealth, referenceDate: Date): SourceHealth["status"] {
    if (sourceHealth.status === "disabled") {
      return "disabled";
    }

    if (sourceHealth.failureCount >= 2) {
      return "cooldown";
    }

    if (!sourceHealth.lastSeenAt) {
      return "error";
    }

    const elapsedSeconds = (referenceDate.getTime() - new Date(sourceHealth.lastSeenAt).getTime()) / 1000;
    return elapsedSeconds > sourceHealth.expectedIntervalSeconds * 2 ? "stale" : "active";
  }

  private createFreshnessAlerts(sourceHealth: SourceHealth): Alert[] {
    const createdAt = this.now().toISOString();

    switch (sourceHealth.status) {
      case "stale":
        return [
          Alert.create({
            id: this.stableId(["stale_source", sourceHealth.sourceId, sourceHealth.status]),
            organizationId: sourceHealth.organizationId,
            projectId: sourceHealth.projectId,
            siteId: sourceHealth.siteId,
            severity: "warning",
            kind: "stale_source",
            message: "Source freshness exceeded the configured reporting interval.",
            createdAt,
          }),
        ];
      case "cooldown":
      case "error":
        return [
          Alert.create({
            id: this.stableId(["sensor_outage", sourceHealth.sourceId, sourceHealth.status]),
            organizationId: sourceHealth.organizationId,
            projectId: sourceHealth.projectId,
            siteId: sourceHealth.siteId,
            severity: "critical",
            kind: "sensor_outage",
            message: "Sensor reporting is unavailable and requires operator attention.",
            createdAt,
          }),
        ];
      default:
        return [];
    }
  }

  private buildAlert(
    detection: Detection,
    severity: Alert["severity"],
    kind: Alert["kind"],
    message: string,
    createdAt: string,
  ): Alert {
    return Alert.create({
      id: this.stableId([kind, detection.siteId, detection.recordedAt]),
      organizationId: detection.organizationId,
      projectId: detection.projectId,
      siteId: detection.siteId,
      severity,
      kind,
      message,
      createdAt,
    });
  }

  private stableId(parts: readonly string[]): string {
    return createHash("sha256").update(parts.join(":"), "utf8").digest("hex").slice(0, 24);
  }
}
