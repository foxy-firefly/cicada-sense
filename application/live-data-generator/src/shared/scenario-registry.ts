import type { GeneratedEvent, Scenario } from "./contracts.js";

interface GeneratorSourcePoint {
  readonly sensorId: string;
  readonly siteId: string;
  readonly speciesId: string;
}

const BASE_EVENT: GeneratedEvent = {
  organizationId: "org-cicada-lab",
  projectId: "project-provence-2026",
  siteId: "site-sainte-victoire",
  sensorId: "sensor-site-sainte-victoire-1",
  speciesId: "species-lyristes-plebejus",
  confidence: 0.88,
  intensity: 72,
  recordedAt: "2026-05-29T10:00:00.000Z",
};

const SOURCE_POINTS: readonly GeneratorSourcePoint[] = [
  { siteId: "site-sainte-victoire", sensorId: "sensor-site-sainte-victoire-1", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-sainte-victoire", sensorId: "sensor-site-sainte-victoire-2", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-sainte-victoire", sensorId: "sensor-site-sainte-victoire-3", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-calanques", sensorId: "sensor-site-calanques-1", speciesId: "species-cicada-orni" },
  { siteId: "site-calanques", sensorId: "sensor-site-calanques-2", speciesId: "species-cicada-orni" },
  { siteId: "site-calanques", sensorId: "sensor-site-calanques-3", speciesId: "species-cicada-orni" },
  { siteId: "site-luberon-east", sensorId: "sensor-site-luberon-east-1", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-luberon-east", sensorId: "sensor-site-luberon-east-2", speciesId: "species-cicada-orni" },
  { siteId: "site-luberon-east", sensorId: "sensor-site-luberon-east-3", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-verdon-south", sensorId: "sensor-site-verdon-south-1", speciesId: "species-cicada-orni" },
  { siteId: "site-verdon-south", sensorId: "sensor-site-verdon-south-2", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-verdon-south", sensorId: "sensor-site-verdon-south-3", speciesId: "species-cicada-orni" },
  { siteId: "site-camargue-west", sensorId: "sensor-site-camargue-west-1", speciesId: "species-cicada-orni" },
  { siteId: "site-camargue-west", sensorId: "sensor-site-camargue-west-2", speciesId: "species-cicada-orni" },
  { siteId: "site-camargue-west", sensorId: "sensor-site-camargue-west-3", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-alpilles-north", sensorId: "sensor-site-alpilles-north-1", speciesId: "species-lyristes-plebejus" },
  { siteId: "site-alpilles-north", sensorId: "sensor-site-alpilles-north-2", speciesId: "species-cicada-orni" },
  { siteId: "site-alpilles-north", sensorId: "sensor-site-alpilles-north-3", speciesId: "species-lyristes-plebejus" },
] as const;

const DEFAULT_SOURCE_POINT: GeneratorSourcePoint = {
  siteId: BASE_EVENT.siteId,
  sensorId: BASE_EVENT.sensorId,
  speciesId: BASE_EVENT.speciesId,
};

export const generatorSourceIds = SOURCE_POINTS.map((point) => point.sensorId);

export class ScenarioRegistry {
  public static list(): Scenario[] {
    return [
      ScenarioRegistry.scenario(
        "calm-day",
        "Calm day",
        "Low-variance baseline across the full monitoring territory.",
        ScenarioRegistry.sequence({
          cadenceMs: 350,
          confidenceBase: 0.84,
          confidenceVariance: 0.06,
          count: 18,
          intensityBase: 58,
          intensityVariance: 10,
          sourceStride: 1,
        }),
      ),
      ScenarioRegistry.scenario(
        "chorus-spike",
        "Chorus spike",
        "High-intensity chorus waves sweep across multiple active stations.",
        ScenarioRegistry.sequence({
          cadenceMs: 250,
          confidenceBase: 0.9,
          confidenceVariance: 0.05,
          count: 24,
          intensityBase: 84,
          intensityVariance: 14,
          sourceStride: 2,
        }),
      ),
      ScenarioRegistry.scenario(
        "heat-stress",
        "Heat stress",
        "Activity rises on exposed habitats while pressure increases across southern sites.",
        ScenarioRegistry.sequence({
          cadenceMs: 300,
          confidenceBase: 0.8,
          confidenceVariance: 0.08,
          count: 22,
          intensityBase: 76,
          intensityVariance: 18,
          sourceIndices: [3, 4, 5, 9, 10, 11, 12, 13, 14],
        }),
      ),
      ScenarioRegistry.scenario(
        "sensor-outage",
        "Sensor outage",
        "Monitoring continues around a site while one station falls quiet and operators investigate.",
        ScenarioRegistry.sequence({
          cadenceMs: 320,
          confidenceBase: 0.78,
          confidenceVariance: 0.09,
          count: 14,
          intensityBase: 48,
          intensityVariance: 16,
          sourceIndices: [0, 1, 3, 4, 9, 10],
        }),
      ),
      ScenarioRegistry.scenario(
        "stale-weather-provider",
        "Stale weather provider",
        "Live cicada detections continue across the ridge while weather context lags behind.",
        ScenarioRegistry.sequence({
          cadenceMs: 300,
          confidenceBase: 0.82,
          confidenceVariance: 0.05,
          count: 16,
          intensityBase: 66,
          intensityVariance: 10,
          sourceIndices: [0, 1, 2, 6, 7, 15, 16],
        }),
      ),
      ScenarioRegistry.scenario(
        "mixed-confidence",
        "Mixed-confidence detections",
        "A busy review session with confidence swings across several stations.",
        ScenarioRegistry.sequence({
          cadenceMs: 280,
          confidenceBase: 0.48,
          confidenceVariance: 0.22,
          count: 20,
          intensityBase: 60,
          intensityVariance: 20,
          sourceStride: 3,
        }),
      ),
      ScenarioRegistry.scenario(
        "multi-site-campaign",
        "Multi-site campaign",
        "A dense coordinated campaign drives detections across the full network.",
        ScenarioRegistry.sequence({
          cadenceMs: 220,
          confidenceBase: 0.86,
          confidenceVariance: 0.1,
          count: 36,
          intensityBase: 72,
          intensityVariance: 22,
          sourceStride: 1,
        }),
      ),
    ];
  }

  public static get(scenarioId: string): Scenario | null {
    return ScenarioRegistry.list().find((scenario) => scenario.id === scenarioId) ?? null;
  }

  public static source(sourceId: string): GeneratorSourcePoint | null {
    return SOURCE_POINTS.find((point) => point.sensorId === sourceId) ?? null;
  }

  private static scenario(
    id: string,
    name: string,
    description: string,
    events: GeneratedEvent[],
    cadenceMs = 300,
  ): Scenario {
    return { id, name, description, cadenceMs, events };
  }

  private static sequence({
    cadenceMs,
    confidenceBase,
    confidenceVariance,
    count,
    intensityBase,
    intensityVariance,
    sourceIndices,
    sourceStride,
  }: {
    readonly cadenceMs: number;
    readonly confidenceBase: number;
    readonly confidenceVariance: number;
    readonly count: number;
    readonly intensityBase: number;
    readonly intensityVariance: number;
    readonly sourceIndices?: readonly number[];
    readonly sourceStride?: number;
  }): GeneratedEvent[] {
    const indices =
      sourceIndices && sourceIndices.length > 0
        ? [...sourceIndices]
        : SOURCE_POINTS.map((_, index) => index).filter((index) => index % Math.max(sourceStride ?? 1, 1) === 0);

    return Array.from({ length: count }, (_, eventIndex) => {
      const sourceIndex = indices[eventIndex % indices.length] ?? 0;
      const source = SOURCE_POINTS[sourceIndex % SOURCE_POINTS.length] ?? DEFAULT_SOURCE_POINT;
      const intensityWave = ((eventIndex * 7) % (intensityVariance * 2 + 1)) - intensityVariance;
      const confidenceWave = (((eventIndex * 5) % 11) - 5) / 5;
      const intensity = Math.max(18, Math.min(100, intensityBase + intensityWave));
      const confidence = Math.max(
        0.24,
        Math.min(0.99, Number((confidenceBase + confidenceWave * confidenceVariance).toFixed(2))),
      );

      return ScenarioRegistry.event({
        confidence,
        intensity,
        offsetSeconds: eventIndex * Math.max(1, Math.round(cadenceMs / 1000)),
        source,
      });
    });
  }

  private static event({
    confidence,
    intensity,
    offsetSeconds,
    source,
  }: {
    readonly confidence: number;
    readonly intensity: number;
    readonly offsetSeconds: number;
    readonly source: GeneratorSourcePoint;
  }): GeneratedEvent {
    const recordedAt = new Date(new Date(BASE_EVENT.recordedAt).getTime() + offsetSeconds * 1000).toISOString();
    return { ...BASE_EVENT, ...source, confidence, intensity, recordedAt };
  }
}
