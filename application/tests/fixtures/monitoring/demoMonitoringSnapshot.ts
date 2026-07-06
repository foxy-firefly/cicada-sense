import { demoAlerts, demoAlertZones } from "./demoAlerts.js";
import { demoHabitatReadings } from "./demoHabitat.js";
import { demoObservations } from "./demoObservations.js";
import { demoSensors, demoSourceHealth } from "./demoSensors.js";
import { demoSummary, demoDetections } from "./demoSignals.js";
import { demoSites, demoTerritories } from "./demoSites.js";
import { demoSpecies } from "./demoSpecies.js";
import { demoTimeline } from "./demoTimeline.js";
import { demoWeather, demoWorkspace } from "./demoWeather.js";

export const demoMonitoringSnapshot = {
  alerts: demoAlerts,
  alertZones: demoAlertZones,
  detections: demoDetections,
  habitatReadings: demoHabitatReadings,
  observations: demoObservations,
  sensors: demoSensors,
  sites: demoSites,
  sourceHealth: demoSourceHealth,
  species: demoSpecies,
  summary: demoSummary,
  territories: demoTerritories,
  timeline: demoTimeline,
  weather: demoWeather,
  workspace: demoWorkspace,
} as const;
