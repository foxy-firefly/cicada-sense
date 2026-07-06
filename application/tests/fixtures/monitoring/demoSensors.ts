import { demoSites } from "./demoSites.js";
import { offsetCoordinates } from "./shared.js";

type FixtureSensorStatus = "active" | "stale" | "cooldown" | "disabled";

const sensorStatusPattern = [
  "active",
  "active",
  "active",
  "active",
  "stale",
  "cooldown",
  "disabled",
  "active",
] as const satisfies readonly FixtureSensorStatus[];

export const demoSensors = demoSites.flatMap((site, siteIndex) =>
  Array.from({ length: 8 }, (_, sensorIndex) => {
    const eastKilometers = -2.6 + (sensorIndex % 4) * 1.6 + siteIndex * 0.22;
    const northKilometers = 1.8 - Math.floor(sensorIndex / 4) * 2.2 + siteIndex * 0.3;
    const status: FixtureSensorStatus =
      sensorStatusPattern[(siteIndex * 3 + sensorIndex) % sensorStatusPattern.length] ?? "active";

    return {
      coordinates: offsetCoordinates(site.coordinates, eastKilometers, northKilometers),
      id: `${site.id}-sensor-${String(sensorIndex + 1).padStart(2, "0")}`,
      name: `${site.name} Acoustic Node ${String(sensorIndex + 1).padStart(2, "0")}`,
      siteId: site.id,
      status,
    };
  }),
);

export const demoSourceHealth = demoSensors.map((sensor, index) => ({
  lastSeenAt:
    sensor.status === "disabled"
      ? null
      : new Date(Date.parse("2025-05-22T14:37:12Z") - (index % 5) * 51 * 1000).toISOString(),
  siteId: sensor.siteId,
  sourceId: sensor.id,
  status: (sensor.status === "cooldown"
    ? "cooldown"
    : sensor.status === "stale"
      ? "stale"
      : sensor.status === "disabled"
        ? "disabled"
        : "active") as FixtureSensorStatus,
}));
