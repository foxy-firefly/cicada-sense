import { demoSites } from "./demoSites.js";
import { FIXTURE_TIMESTAMP, isoMinutesBefore, offsetCoordinates } from "./shared.js";

const observationSpeciesLabels = [
  "Periodical Cicada",
  "Cassini Cicada",
  "Nymph Shell Cluster",
  "Canopy Chorus",
] as const;

export const demoObservations = demoSites.flatMap((site, siteIndex) =>
  Array.from({ length: 80 }, (_, observationIndex) => {
    const arc = observationIndex / 8;
    const eastKilometers = Math.cos(arc) * (0.45 + (observationIndex % 6) * 0.18);
    const northKilometers = Math.sin(arc) * (0.3 + (observationIndex % 5) * 0.16);

    return {
      coordinates: offsetCoordinates(site.coordinates, eastKilometers, northKilometers),
      id: `${site.id}-observation-${String(observationIndex + 1).padStart(3, "0")}`,
      intensity: 36 + ((siteIndex * 19 + observationIndex * 7) % 63),
      observedAt: isoMinutesBefore(FIXTURE_TIMESTAMP, siteIndex * 18 + observationIndex * 11),
      siteId: site.id,
      speciesLabel:
        observationSpeciesLabels[(siteIndex + observationIndex) % observationSpeciesLabels.length] ??
        observationSpeciesLabels[0],
    };
  }),
);
