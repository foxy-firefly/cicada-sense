import { buildRoundedPolygon } from "./shared.js";

export const demoSites = [
  {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    coordinates: { latitude: 42.1549, longitude: -88.1367 },
    elevationMeters: 281,
    emergenceWindow: { end: "2025-06-30", start: "2025-04-15" },
    habitatClass: "Wet meadow corridor",
    habitatScore: 84,
    id: "site-barrington-marsh",
    name: "Barrington Marsh Preserve",
    seasonProgress: { currentDay: 38, totalDays: 77 },
    territoryId: "territory-barrington",
  },
  {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    coordinates: { latitude: 43.0532, longitude: -88.5418 },
    elevationMeters: 344,
    emergenceWindow: { end: "2025-06-24", start: "2025-04-18" },
    habitatClass: "Oak savanna ridge",
    habitatScore: 79,
    id: "site-kettle-moraine",
    name: "Kettle Moraine North Ridge",
    seasonProgress: { currentDay: 35, totalDays: 68 },
    territoryId: "territory-kettle-moraine",
  },
  {
    broodLabel: "Brood XIII · 17-Year Cicadas",
    coordinates: { latitude: 42.0421, longitude: -87.8637 },
    elevationMeters: 196,
    emergenceWindow: { end: "2025-06-20", start: "2025-04-12" },
    habitatClass: "Riparian woodland edge",
    habitatScore: 73,
    id: "site-des-plaines",
    name: "Des Plaines River Corridor",
    seasonProgress: { currentDay: 41, totalDays: 70 },
    territoryId: "territory-des-plaines",
  },
] as const;

export const demoTerritories = [
  {
    coordinates: buildRoundedPolygon(demoSites[0].coordinates, 4.8, 3.5),
    id: "territory-barrington",
    name: "Barrington Marsh Territory",
  },
  {
    coordinates: buildRoundedPolygon(demoSites[1].coordinates, 5.6, 4.1),
    id: "territory-kettle-moraine",
    name: "Kettle Moraine Territory",
  },
  {
    coordinates: buildRoundedPolygon(demoSites[2].coordinates, 5.1, 3.1),
    id: "territory-des-plaines",
    name: "Des Plaines Territory",
  },
] as const;
