import type { PrismaClient } from "@prisma/client";
import type { CicadaRepository } from "../application/ports.js";
import {
  Alert,
  type CicadaDataset,
  Detection,
  Organization,
  Project,
  Sensor,
  Site,
  SourceHealth,
  Species,
} from "../domain/model.js";

export class PrismaCicadaRepository implements CicadaRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async loadDataset(dataset: CicadaDataset): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.alert.deleteMany();
      await transaction.sourceHealth.deleteMany();
      await transaction.detection.deleteMany();
      await transaction.sensor.deleteMany();
      await transaction.species.deleteMany();
      await transaction.site.deleteMany();
      await transaction.project.deleteMany();
      await transaction.organization.deleteMany();

      if (dataset.organizations.length > 0) {
        await transaction.organization.createMany({
          data: dataset.organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
          })),
        });
      }

      if (dataset.projects.length > 0) {
        await transaction.project.createMany({
          data: dataset.projects.map((project) => ({
            id: project.id,
            name: project.name,
            organizationId: project.organizationId,
          })),
        });
      }

      if (dataset.sites.length > 0) {
        await transaction.site.createMany({
          data: dataset.sites.map((site) => ({
            habitatScore: site.habitatScore,
            id: site.id,
            latitude: site.coordinates.latitude,
            longitude: site.coordinates.longitude,
            name: site.name,
            organizationId: site.organizationId,
            projectId: site.projectId,
          })),
        });
      }

      if (dataset.sensors.length > 0) {
        await transaction.sensor.createMany({
          data: dataset.sensors.map((sensor) => ({
            expectedIntervalSeconds: sensor.expectedIntervalSeconds,
            id: sensor.id,
            latitude: sensor.coordinates.latitude,
            longitude: sensor.coordinates.longitude,
            name: sensor.name,
            organizationId: sensor.organizationId,
            projectId: sensor.projectId,
            siteId: sensor.siteId,
            status: sensor.status,
          })),
        });
      }

      if (dataset.species.length > 0) {
        await transaction.species.createMany({
          data: dataset.species.map((species) => ({
            commonName: species.commonName,
            id: species.id,
            scientificName: species.scientificName,
          })),
        });
      }

      if (dataset.detections.length > 0) {
        await transaction.detection.createMany({
          data: dataset.detections.map((detection) => ({
            confidence: detection.confidence,
            id: detection.id,
            intensity: detection.intensity,
            organizationId: detection.organizationId,
            projectId: detection.projectId,
            recordedAt: new Date(detection.recordedAt),
            sensorId: detection.sensorId,
            siteId: detection.siteId,
            speciesId: detection.speciesId,
          })),
        });
      }

      if (dataset.sourceHealth.length > 0) {
        await transaction.sourceHealth.createMany({
          data: dataset.sourceHealth.map((sourceHealth) => ({
            expectedIntervalSeconds: sourceHealth.expectedIntervalSeconds,
            failureCount: sourceHealth.failureCount,
            lastSeenAt: sourceHealth.lastSeenAt ? new Date(sourceHealth.lastSeenAt) : null,
            organizationId: sourceHealth.organizationId,
            projectId: sourceHealth.projectId,
            siteId: sourceHealth.siteId,
            sourceId: sourceHealth.sourceId,
            status: sourceHealth.status,
          })),
        });
      }

      if (dataset.alerts.length > 0) {
        await transaction.alert.createMany({
          data: dataset.alerts.map((alert) => ({
            createdAt: new Date(alert.createdAt),
            id: alert.id,
            kind: alert.kind,
            message: alert.message,
            organizationId: alert.organizationId,
            projectId: alert.projectId,
            severity: alert.severity,
            siteId: alert.siteId,
          })),
        });
      }
    });
  }

  public async listOrganizations(): Promise<Organization[]> {
    const organizations = await this.prisma.organization.findMany({ orderBy: { id: "asc" } });
    return organizations.map((organization) => Organization.create(organization));
  }

  public async listProjects(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({ orderBy: { id: "asc" } });
    return projects.map((project) => Project.create(project));
  }

  public async listSites(): Promise<Site[]> {
    const sites = await this.prisma.site.findMany({ orderBy: { id: "asc" } });
    return sites.map((site) =>
      Site.create({
        habitatScore: site.habitatScore,
        id: site.id,
        name: site.name,
        organizationId: site.organizationId,
        projectId: site.projectId,
        coordinates: {
          latitude: site.latitude,
          longitude: site.longitude,
        },
      }),
    );
  }

  public async listSensors(): Promise<Sensor[]> {
    const sensors = await this.prisma.sensor.findMany({ orderBy: { id: "asc" } });
    return sensors.map((sensor) =>
      Sensor.create({
        expectedIntervalSeconds: sensor.expectedIntervalSeconds,
        id: sensor.id,
        name: sensor.name,
        organizationId: sensor.organizationId,
        projectId: sensor.projectId,
        siteId: sensor.siteId,
        status: sensor.status as Sensor["status"],
        coordinates: {
          latitude: sensor.latitude,
          longitude: sensor.longitude,
        },
      }),
    );
  }

  public async listSpecies(): Promise<Species[]> {
    const species = await this.prisma.species.findMany({ orderBy: { id: "asc" } });
    return species.map((entry) => Species.create(entry));
  }

  public async listDetections(): Promise<Detection[]> {
    const detections = await this.prisma.detection.findMany({ orderBy: { id: "asc" } });
    return detections.map((detection) =>
      Detection.create({
        confidence: detection.confidence,
        id: detection.id,
        intensity: detection.intensity,
        organizationId: detection.organizationId,
        projectId: detection.projectId,
        recordedAt: detection.recordedAt.toISOString(),
        sensorId: detection.sensorId,
        siteId: detection.siteId,
        speciesId: detection.speciesId,
      }),
    );
  }

  public async listSourceHealth(): Promise<SourceHealth[]> {
    const sourceHealthEntries = await this.prisma.sourceHealth.findMany({ orderBy: { sourceId: "asc" } });
    return sourceHealthEntries.map((sourceHealth) =>
      SourceHealth.create({
        expectedIntervalSeconds: sourceHealth.expectedIntervalSeconds,
        failureCount: sourceHealth.failureCount,
        lastSeenAt: sourceHealth.lastSeenAt ? sourceHealth.lastSeenAt.toISOString() : null,
        organizationId: sourceHealth.organizationId,
        projectId: sourceHealth.projectId,
        siteId: sourceHealth.siteId,
        sourceId: sourceHealth.sourceId,
        status: sourceHealth.status as SourceHealth["status"],
      }),
    );
  }

  public async listAlerts(): Promise<Alert[]> {
    const alerts = await this.prisma.alert.findMany({ orderBy: { id: "asc" } });
    return alerts.map((alert) =>
      Alert.create({
        createdAt: alert.createdAt.toISOString(),
        id: alert.id,
        kind: alert.kind as Alert["kind"],
        message: alert.message,
        organizationId: alert.organizationId,
        projectId: alert.projectId,
        severity: alert.severity as Alert["severity"],
        siteId: alert.siteId,
      }),
    );
  }

  public async saveDetection(detection: Detection): Promise<void> {
    await this.prisma.detection.upsert({
      where: { id: detection.id },
      update: {
        confidence: detection.confidence,
        intensity: detection.intensity,
        organizationId: detection.organizationId,
        projectId: detection.projectId,
        recordedAt: new Date(detection.recordedAt),
        sensorId: detection.sensorId,
        siteId: detection.siteId,
        speciesId: detection.speciesId,
      },
      create: {
        confidence: detection.confidence,
        id: detection.id,
        intensity: detection.intensity,
        organizationId: detection.organizationId,
        projectId: detection.projectId,
        recordedAt: new Date(detection.recordedAt),
        sensorId: detection.sensorId,
        siteId: detection.siteId,
        speciesId: detection.speciesId,
      },
    });
  }

  public async saveSourceHealth(sourceHealth: SourceHealth): Promise<void> {
    await this.prisma.sourceHealth.upsert({
      where: { sourceId: sourceHealth.sourceId },
      update: {
        expectedIntervalSeconds: sourceHealth.expectedIntervalSeconds,
        failureCount: sourceHealth.failureCount,
        lastSeenAt: sourceHealth.lastSeenAt ? new Date(sourceHealth.lastSeenAt) : null,
        organizationId: sourceHealth.organizationId,
        projectId: sourceHealth.projectId,
        siteId: sourceHealth.siteId,
        status: sourceHealth.status,
      },
      create: {
        expectedIntervalSeconds: sourceHealth.expectedIntervalSeconds,
        failureCount: sourceHealth.failureCount,
        lastSeenAt: sourceHealth.lastSeenAt ? new Date(sourceHealth.lastSeenAt) : null,
        organizationId: sourceHealth.organizationId,
        projectId: sourceHealth.projectId,
        siteId: sourceHealth.siteId,
        sourceId: sourceHealth.sourceId,
        status: sourceHealth.status,
      },
    });
  }

  public async saveAlert(alert: Alert): Promise<void> {
    await this.prisma.alert.upsert({
      where: { id: alert.id },
      update: {},
      create: {
        createdAt: new Date(alert.createdAt),
        id: alert.id,
        kind: alert.kind,
        message: alert.message,
        organizationId: alert.organizationId,
        projectId: alert.projectId,
        severity: alert.severity,
        siteId: alert.siteId,
      },
    });
  }
}
