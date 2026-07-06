import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Alert, Detection, SourceHealth } from "../domain/model.js";
import { StaticFixtureDataset } from "../fixtures/static-fixtures.js";
import { InMemoryCicadaRepository } from "./in-memory-cicada-repository.js";
import { PrismaCicadaRepository } from "./prisma-cicada-repository.js";

function defineRepositoryContractSuite(
  name: string,
  createRepository: () =>
    | Promise<InMemoryCicadaRepository | PrismaCicadaRepository>
    | InMemoryCicadaRepository
    | PrismaCicadaRepository,
) {
  describe(name, () => {
    it("loads and lists the deterministic fixture dataset", async () => {
      const repository = await createRepository();
      const dataset = StaticFixtureDataset.demo();

      await repository.loadDataset(dataset);

      await expect(repository.listOrganizations().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.organizations, "id"),
      );
      await expect(repository.listProjects().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.projects, "id"),
      );
      await expect(repository.listSites().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.sites, "id"),
      );
      await expect(repository.listSensors().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.sensors, "id"),
      );
      await expect(repository.listSpecies().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.species, "id"),
      );
      await expect(repository.listDetections().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.detections, "id"),
      );
      await expect(repository.listSourceHealth().then((values) => sortByKey(values, "sourceId"))).resolves.toEqual(
        sortByKey(dataset.sourceHealth, "sourceId"),
      );
      await expect(repository.listAlerts().then((values) => sortByKey(values, "id"))).resolves.toEqual(
        sortByKey(dataset.alerts, "id"),
      );
    });

    it("upserts detections and source health and suppresses duplicate alerts", async () => {
      const repository = await createRepository();

      await repository.loadDataset(StaticFixtureDataset.demo());

      const detection = Detection.create({
        id: "detection-contract-002",
        organizationId: "org-cicada-lab",
        projectId: "project-provence-2026",
        siteId: "site-sainte-victoire",
        sensorId: "sensor-ridge-01",
        speciesId: "species-lyristes-plebejus",
        confidence: 0.87,
        intensity: 83,
        recordedAt: "2026-05-29T10:15:00.000Z",
      });
      const sourceHealth = SourceHealth.create({
        sourceId: "sensor-ridge-01",
        organizationId: "org-cicada-lab",
        projectId: "project-provence-2026",
        siteId: "site-sainte-victoire",
        status: "active",
        lastSeenAt: "2026-05-29T10:15:00.000Z",
        expectedIntervalSeconds: 60,
        failureCount: 1,
      });
      const alert = Alert.create({
        id: "alert-contract-001",
        organizationId: "org-cicada-lab",
        projectId: "project-provence-2026",
        siteId: "site-sainte-victoire",
        severity: "warning",
        kind: "chorus_spike",
        message: "Chorus intensity exceeded the configured site baseline.",
        createdAt: "2026-05-29T10:15:00.000Z",
      });

      await repository.saveDetection(detection);
      await repository.saveSourceHealth(sourceHealth);
      await repository.saveAlert(alert);
      await repository.saveAlert(alert);

      await expect(repository.listDetections()).resolves.toContainEqual(detection);
      await expect(repository.listSourceHealth()).resolves.toContainEqual(sourceHealth);
      await expect(repository.listAlerts()).resolves.toContainEqual(alert);
      await expect(repository.listAlerts()).resolves.toSatisfy(
        (alerts) => alerts.filter((entry: Alert) => entry.id === alert.id).length === 1,
      );
    });
  });
}

function sortByKey<T, K extends keyof T>(values: readonly T[], key: K): T[] {
  return [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
}

defineRepositoryContractSuite("InMemoryCicadaRepository contract", () => new InMemoryCicadaRepository());

const postgresDescribe = process.env.DATABASE_URL ? describe : describe.skip;

postgresDescribe("PrismaCicadaRepository contract", () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
  const prisma = new PrismaClient({ adapter });
  const repository = new PrismaCicadaRepository(prisma);

  beforeEach(async () => {
    await prisma.alert.deleteMany();
    await prisma.sourceHealth.deleteMany();
    await prisma.detection.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.species.deleteMany();
    await prisma.site.deleteMany();
    await prisma.project.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  defineRepositoryContractSuite("postgres implementation", async () => repository);
});
