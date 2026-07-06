import { demoSites } from "./demoSites.js";
import { offsetCoordinates } from "./shared.js";

export const demoHabitatReadings = demoSites.flatMap((site, siteIndex) =>
  Array.from({ length: 180 }, (_, habitatIndex) => {
    const eastKilometers = -3.4 + (habitatIndex % 15) * 0.42;
    const northKilometers = -2.1 + Math.floor(habitatIndex / 15) * 0.36;

    return {
      coordinates: offsetCoordinates(site.coordinates, eastKilometers, northKilometers),
      id: `${site.id}-habitat-${String(habitatIndex + 1).padStart(3, "0")}`,
      moisturePercent: 34 + ((siteIndex * 11 + habitatIndex * 5) % 48),
      siteId: site.id,
      vegetationHealth: 44 + ((siteIndex * 17 + habitatIndex * 3) % 52),
    };
  }),
);
