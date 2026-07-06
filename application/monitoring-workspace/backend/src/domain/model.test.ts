import { describe, expect, it } from "vitest";
import { DomainError, ErrorCode } from "./error-codes.js";
import { Coordinates, Detection, Organization, Site } from "./model.js";

describe("backend domain entities", () => {
  it("constructs valid entities", () => {
    const organization = Organization.create({
      id: "org-cicada-lab",
      name: "Cicada Lab",
    });
    const site = Site.create({
      id: "site-sainte-victoire",
      organizationId: organization.id,
      projectId: "project-provence-2026",
      name: "Sainte-Victoire Ridge",
      coordinates: Coordinates.create({ latitude: 43.532, longitude: 5.574 }),
      habitatScore: 82,
    });

    expect(site.coordinates.latitude).toBe(43.532);
    expect(site.organizationId).toBe(organization.id);
  });

  it("rejects invalid coordinates", () => {
    expect(() => Coordinates.create({ latitude: 120, longitude: 5.574 })).toThrowError(
      new DomainError(ErrorCode.InvalidCoordinates),
    );
  });

  it("rejects invalid detection confidence", () => {
    expect(() =>
      Detection.create({
        id: "detection-fixture-001",
        organizationId: "org-cicada-lab",
        projectId: "project-provence-2026",
        siteId: "site-sainte-victoire",
        sensorId: "sensor-ridge-01",
        speciesId: "species-lyristes-plebejus",
        confidence: 1.2,
        intensity: 78,
        recordedAt: "2026-05-29T10:00:00.000Z",
      }),
    ).toThrowError(new DomainError(ErrorCode.InvalidDetectionConfidence));
  });

  it("rejects empty required strings", () => {
    expect(() => Organization.create({ id: "", name: "Cicada Lab" })).toThrowError(
      new DomainError(ErrorCode.InvalidDomainObject, "organization.id must not be empty"),
    );
  });
});
