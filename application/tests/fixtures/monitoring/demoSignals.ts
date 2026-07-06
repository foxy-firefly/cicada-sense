import { demoSensors } from "./demoSensors.js";
import { demoSpecies } from "./demoSpecies.js";
import { FIXTURE_TIMESTAMP, isoMinutesBefore } from "./shared.js";

const DEFAULT_SENSOR = demoSensors[0];
const DEFAULT_SPECIES = demoSpecies[0];

if (!DEFAULT_SENSOR || !DEFAULT_SPECIES) {
  throw new Error("demoSensors and demoSpecies must have at least one entry");
}

export const demoSummary = {
  acousticActivity: 7.6,
  activeAlerts: 3,
  dataFreshnessSeconds: 134,
  emergenceProbability: 64,
  speciesConfidence: 82,
} as const;

export const demoDetections = Array.from({ length: 48 }, (_, detectionIndex) => {
  const sensor = demoSensors[detectionIndex % demoSensors.length] ?? DEFAULT_SENSOR;
  const species = demoSpecies[detectionIndex % demoSpecies.length] ?? DEFAULT_SPECIES;
  const recordedAt = isoMinutesBefore(FIXTURE_TIMESTAMP, detectionIndex * 28);
  const intensity = 54 + ((detectionIndex * 9) % 41);
  const confidence = 0.71 + ((detectionIndex * 7) % 20) / 100;

  return {
    confidence: Number(confidence.toFixed(2)),
    id: `detection-${String(detectionIndex + 1).padStart(3, "0")}`,
    intensity,
    recordedAt,
    sensorId: sensor.id,
    siteId: sensor.siteId,
    speciesId: species.id,
  };
});
