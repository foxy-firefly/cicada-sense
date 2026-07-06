import { demoSites } from "./demoSites.js";
import { buildRoundedPolygon, FIXTURE_TIMESTAMP, isoMinutesBefore, offsetCoordinates } from "./shared.js";

export const demoAlerts = [
  {
    createdAt: isoMinutesBefore(FIXTURE_TIMESTAMP, 22),
    id: "alert-acoustic-surge",
    kind: "high_acoustic_activity",
    message: "High acoustic activity at Barrington Marsh Preserve",
    severity: "critical",
    siteId: demoSites[0].id,
  },
  {
    createdAt: isoMinutesBefore(FIXTURE_TIMESTAMP, 74),
    id: "alert-heat-stress",
    kind: "heat_stress_risk",
    message: "Heat stress risk rising on Kettle Moraine North Ridge",
    severity: "warning",
    siteId: demoSites[1].id,
  },
  {
    createdAt: isoMinutesBefore(FIXTURE_TIMESTAMP, 132),
    id: "alert-sensor-offline",
    kind: "sensor_offline",
    message: "Field repeater offline near Des Plaines River Corridor",
    severity: "warning",
    siteId: demoSites[2].id,
  },
] as const;

export const demoAlertZones = [
  {
    coordinates: buildRoundedPolygon(offsetCoordinates(demoSites[0].coordinates, 2.2, -0.3), 1.1, 0.9),
    id: "alert-zone-barrington",
    label: "Acoustic surge zone",
    severity: "critical",
    siteId: demoSites[0].id,
  },
  {
    coordinates: buildRoundedPolygon(offsetCoordinates(demoSites[1].coordinates, -1.8, 1.2), 1.4, 1.2),
    id: "alert-zone-kettle-moraine",
    label: "Heat stress watch",
    severity: "warning",
    siteId: demoSites[1].id,
  },
  {
    coordinates: buildRoundedPolygon(offsetCoordinates(demoSites[2].coordinates, 1.4, -1.1), 0.9, 0.8),
    id: "alert-zone-des-plaines",
    label: "Offline repeater search",
    severity: "warning",
    siteId: demoSites[2].id,
  },
] as const;
