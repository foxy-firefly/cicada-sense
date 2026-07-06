import { z } from "zod";

export const generatedEventSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  siteId: z.string().min(1),
  sensorId: z.string().min(1),
  speciesId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  intensity: z.number().min(0).max(100),
  recordedAt: z.string().datetime(),
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  cadenceMs: z.number().int().positive(),
  events: z.array(generatedEventSchema).min(1),
});

export const playbackCommandSchema = z.object({
  scenarioId: z.string().min(1),
  speed: z.number().positive().default(1),
});

export const playbackSpeedSchema = z.object({
  speed: z.number().positive(),
});

export const failureInjectionSchema = z.object({
  sourceId: z.string().min(1),
  kind: z.enum(["outage", "stale", "low_confidence"]),
});

export type GeneratedEvent = z.infer<typeof generatedEventSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type PlaybackCommand = z.infer<typeof playbackCommandSchema>;
export type PlaybackSpeed = z.infer<typeof playbackSpeedSchema>;
export type FailureInjection = z.infer<typeof failureInjectionSchema>;

export interface PlaybackState {
  readonly currentScenarioId: string | null;
  readonly emittedEvents: readonly GeneratedEvent[];
  readonly isPlaying: boolean;
  readonly speed: number;
}
