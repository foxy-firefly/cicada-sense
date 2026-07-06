import { describe, expect, it } from "vitest";
import { BackendApplicationFactory } from "../../app/create-backend-application.js";
import {
  BackendObservability,
  type StructuredLogEntry,
  type StructuredLogger,
} from "../../infrastructure/observability.js";

class RecordingLogger implements StructuredLogger {
  public readonly entries: StructuredLogEntry[] = [];

  public log(entry: StructuredLogEntry): void {
    this.entries.push(entry);
  }
}

describe("CicadaHttpServer", () => {
  const tenantHeaders = { "x-organization-id": "org-cicada-lab" };

  it("serves health and bootstrap data", async () => {
    const server = await BackendApplicationFactory.create();
    await server.listen(0);

    try {
      const requestId = "req-backend-health";
      const rootHealthResponse = await fetch(`${server.address()}/health`, {
        headers: { "x-request-id": requestId },
      });
      const rootHealth = await rootHealthResponse.json();
      const health = await fetch(`${server.address()}/api/health/live`).then((response) => response.json());
      const bootstrap = await fetch(`${server.address()}/api/bootstrap`, { headers: tenantHeaders }).then((response) =>
        response.json(),
      );
      const organizations = await fetch(`${server.address()}/api/organizations`, { headers: tenantHeaders }).then(
        (response) => response.json(),
      );
      const projects = await fetch(`${server.address()}/api/projects`, { headers: tenantHeaders }).then((response) =>
        response.json(),
      );
      const sites = await fetch(`${server.address()}/api/sites`, { headers: tenantHeaders }).then((response) =>
        response.json(),
      );
      const sensors = await fetch(`${server.address()}/api/sensors`, { headers: tenantHeaders }).then((response) =>
        response.json(),
      );
      const sourceHealth = await fetch(`${server.address()}/api/source-health`, { headers: tenantHeaders }).then(
        (response) => response.json(),
      );
      const metrics = await fetch(`${server.address()}/metrics`).then((response) => response.json());

      expect(rootHealth.status).toBe("ok");
      expect(rootHealth.service).toBe("monitoring-backend");
      expect(rootHealth.sources).toBe(18);
      expect(rootHealth.uptimeSeconds).toEqual(expect.any(Number));
      expect(rootHealthResponse.headers.get("x-request-id")).toBe(requestId);
      expect(health.status).toBe("ok");
      expect(organizations).toHaveLength(1);
      expect(projects).toHaveLength(1);
      expect(bootstrap.workspace.name).toBe("Province 2026");
      expect(bootstrap.summary.acousticActivity).toBeGreaterThan(0);
      expect(bootstrap.sites).toHaveLength(6);
      expect(bootstrap.territories).toHaveLength(6);
      expect(bootstrap.observations.length).toBeGreaterThanOrEqual(200);
      expect(bootstrap.habitatReadings.length).toBeGreaterThanOrEqual(500);
      expect(sites).toHaveLength(6);
      expect(sensors).toHaveLength(18);
      expect(sourceHealth).toHaveLength(18);
      expect(metrics.service).toBe("monitoring-backend");
      expect(metrics.requestsTotal).toBeGreaterThanOrEqual(8);
      expect(metrics.requestsByPath["/health"]).toBeGreaterThanOrEqual(1);
      expect(metrics.requestsByPath["/api/bootstrap"]).toBeGreaterThanOrEqual(1);
      expect(metrics.detectionsIngested).toBe(0);
    } finally {
      await server.close();
    }
  });

  it("accepts published generator events through the ingestion API and stores normalized detections", async () => {
    const server = await BackendApplicationFactory.create();
    await server.listen(0);

    try {
      const publishedEvents = [
        {
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          sensorId: "sensor-site-sainte-victoire-1",
          speciesId: "species-lyristes-plebejus",
          confidence: 0.93,
          intensity: 96,
          recordedAt: "2026-05-29T10:00:00.000Z",
        },
        {
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          sensorId: "sensor-site-sainte-victoire-1",
          speciesId: "species-lyristes-plebejus",
          confidence: 0.94,
          intensity: 98,
          recordedAt: "2026-05-29T10:01:00.000Z",
        },
      ];

      for (const event of publishedEvents) {
        const response = await fetch(`${server.address()}/api/ingest/detections`, {
          body: JSON.stringify(event),
          headers: { ...tenantHeaders, "content-type": "application/json" },
          method: "POST",
        });

        expect(response.status).toBe(202);
      }

      const bootstrap = await fetch(`${server.address()}/api/bootstrap`, { headers: tenantHeaders }).then((response) =>
        response.json(),
      );

      expect(bootstrap.detections.length).toBeGreaterThan(1);
      expect(bootstrap.detections.at(-1)?.siteId).toBe("site-sainte-victoire");
      expect(bootstrap.detections.at(-1)?.sensorId).toBe("sensor-site-sainte-victoire-1");
      expect(bootstrap.detections.at(-1)?.id).toBeTruthy();
    } finally {
      await server.close();
    }
  });

  it("records request-scoped logs for health and ingestion flows", async () => {
    const logger = new RecordingLogger();
    const server = await BackendApplicationFactory.create({
      observability: new BackendObservability(logger),
    });
    await server.listen(0);

    try {
      const requestId = "trace-backend-001";
      const healthResponse = await fetch(`${server.address()}/health`, {
        headers: { "x-request-id": requestId },
      });

      expect(healthResponse.status).toBe(200);

      const ingestResponse = await fetch(`${server.address()}/api/ingest/detections`, {
        body: JSON.stringify({
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          sensorId: "sensor-site-sainte-victoire-1",
          speciesId: "species-lyristes-plebejus",
          confidence: 0.93,
          intensity: 96,
          recordedAt: "2026-05-29T10:00:00.000Z",
        }),
        headers: {
          "content-type": "application/json",
          "x-organization-id": "org-cicada-lab",
          "x-request-id": requestId,
        },
        method: "POST",
      });

      expect(ingestResponse.status).toBe(202);

      expect(
        logger.entries.some(
          (entry) =>
            entry.event === "http.request.completed" &&
            entry.path === "/health" &&
            entry.requestId === requestId &&
            entry.statusCode === 200,
        ),
      ).toBe(true);
      expect(
        logger.entries.some(
          (entry) =>
            entry.event === "http.request.completed" &&
            entry.path === "/api/ingest/detections" &&
            entry.requestId === requestId &&
            entry.statusCode === 202,
        ),
      ).toBe(true);
      expect(
        logger.entries.some(
          (entry) =>
            entry.event === "detection.ingested" &&
            entry.requestId === requestId &&
            entry.sensorId === "sensor-site-sainte-victoire-1",
        ),
      ).toBe(true);
    } finally {
      await server.close();
    }
  });

  it("rejects disallowed origins", async () => {
    const server = await BackendApplicationFactory.create();
    await server.listen(0);

    try {
      const response = await fetch(`${server.address()}/api/bootstrap`, {
        headers: {
          origin: "https://evil.example",
          "x-organization-id": "org-cicada-lab",
        },
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "DISALLOWED_ORIGIN" });
    } finally {
      await server.close();
    }
  });

  it("rejects cross-tenant access and invalid ingestion payloads", async () => {
    const server = await BackendApplicationFactory.create();
    await server.listen(0);

    try {
      const bootstrapResponse = await fetch(`${server.address()}/api/bootstrap`, {
        headers: { "x-organization-id": "org-unknown" },
      });

      expect(bootstrapResponse.status).toBe(403);
      await expect(bootstrapResponse.json()).resolves.toMatchObject({ error: "TENANT_MISMATCH" });

      const ingestionResponse = await fetch(`${server.address()}/api/ingest/detections`, {
        body: JSON.stringify({
          organizationId: "org-cicada-lab",
          projectId: "project-provence-2026",
          siteId: "site-sainte-victoire",
          sensorId: "sensor-site-sainte-victoire-1",
          speciesId: "species-lyristes-plebejus",
          confidence: 1.8,
          intensity: 96,
          recordedAt: "2026-05-29T10:00:00.000Z",
        }),
        headers: {
          "content-type": "application/json",
          "x-organization-id": "org-cicada-lab",
        },
        method: "POST",
      });

      expect(ingestionResponse.status).toBe(400);
      await expect(ingestionResponse.json()).resolves.toMatchObject({ error: "INVALID_DETECTION_CONFIDENCE" });
    } finally {
      await server.close();
    }
  });

  it("rate limits repeated requests to protected endpoints", async () => {
    const server = await BackendApplicationFactory.create({
      security: {
        rateLimitMaxRequests: 2,
        rateLimitWindowMs: 60_000,
      },
    });
    await server.listen(0);

    try {
      const headers = { "x-organization-id": "org-cicada-lab" };
      expect((await fetch(`${server.address()}/api/bootstrap`, { headers })).status).toBe(200);
      expect((await fetch(`${server.address()}/api/bootstrap`, { headers })).status).toBe(200);

      const rateLimited = await fetch(`${server.address()}/api/bootstrap`, { headers });

      expect(rateLimited.status).toBe(429);
      await expect(rateLimited.json()).resolves.toEqual({ error: "RATE_LIMITED" });
    } finally {
      await server.close();
    }
  });
});
