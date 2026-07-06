import { FIXTURE_TIMESTAMP } from "./shared.js";

export const demoWorkspace = {
  id: "fixture-workspace",
  mode: "live",
  name: "Eco Research Lab",
  timestamp: FIXTURE_TIMESTAMP,
} as const;

export const demoWeather = {
  humidity: 64,
  precipitationMmH: 0.2,
  temperatureC: 24.6,
  windDirection: "NW",
  windSpeedKmh: 12,
} as const;
