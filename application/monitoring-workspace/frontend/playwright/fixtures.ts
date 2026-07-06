export const bootstrapFixture = {
  alerts: [
    {
      createdAt: "2026-05-29T10:00:00.000Z",
      id: "alert-fixture-stale-calanques",
      kind: "stale_source",
      message: "Calanques acoustic source is stale.",
      severity: "warning",
      siteId: "site-calanques",
    },
  ],
  detections: [
    {
      confidence: 0.92,
      id: "detection-fixture-001",
      intensity: 78,
      recordedAt: "2026-05-29T10:00:00.000Z",
      sensorId: "sensor-ridge-01",
      siteId: "site-sainte-victoire",
      speciesId: "species-lyristes-plebejus",
    },
  ],
  sensors: [],
  sites: [
    {
      coordinates: { latitude: 43.532, longitude: 5.574 },
      habitatScore: 82,
      id: "site-sainte-victoire",
      name: "Sainte-Victoire Ridge",
    },
  ],
  sourceHealth: [
    {
      lastSeenAt: "2026-05-29T10:00:00.000Z",
      siteId: "site-sainte-victoire",
      sourceId: "sensor-ridge-01",
      status: "active",
    },
  ],
  species: [
    {
      commonName: "Common Cicada",
      id: "species-lyristes-plebejus",
      scientificName: "Lyristes plebejus",
    },
  ],
};

export const keyboardNavigationFixture = {
  ...bootstrapFixture,
  alerts: [
    ...bootstrapFixture.alerts,
    {
      createdAt: "2026-05-29T10:05:00.000Z",
      id: "alert-fixture-ridge",
      kind: "chorus_spike",
      message: "Ridge chorus intensity exceeded the configured site baseline.",
      severity: "warning",
      siteId: "site-sainte-victoire",
    },
  ],
  sensors: [
    {
      coordinates: { latitude: 43.5325, longitude: 5.575 },
      id: "sensor-ridge-01",
      name: "Ridge Acoustic Node 01",
      siteId: "site-sainte-victoire",
      status: "active",
    },
    {
      coordinates: { latitude: 43.2145, longitude: 5.4475 },
      id: "sensor-calanques-01",
      name: "Calanques Acoustic Node 01",
      siteId: "site-calanques",
      status: "stale",
    },
  ],
  sites: [
    ...bootstrapFixture.sites,
    {
      coordinates: { latitude: 43.214, longitude: 5.447 },
      habitatScore: 68,
      id: "site-calanques",
      name: "Calanques North Slope",
    },
  ],
  sourceHealth: [
    ...bootstrapFixture.sourceHealth,
    {
      lastSeenAt: "2026-05-29T09:30:00.000Z",
      siteId: "site-calanques",
      sourceId: "sensor-calanques-01",
      status: "stale",
    },
  ],
};
