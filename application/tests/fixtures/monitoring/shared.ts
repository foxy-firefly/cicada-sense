export interface FixtureCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export const FIXTURE_TIMESTAMP = "2025-05-22T14:37:12Z";

export function isoMinutesBefore(referenceIso: string, minutesBefore: number): string {
  return new Date(new Date(referenceIso).getTime() - minutesBefore * 60 * 1000).toISOString();
}

export function offsetCoordinates(
  origin: FixtureCoordinates,
  eastKilometers: number,
  northKilometers: number,
): FixtureCoordinates {
  const latitudeOffset = northKilometers / 111;
  const longitudeOffset = eastKilometers / (111 * Math.cos((origin.latitude * Math.PI) / 180));

  return {
    latitude: Number((origin.latitude + latitudeOffset).toFixed(6)),
    longitude: Number((origin.longitude + longitudeOffset).toFixed(6)),
  };
}

export function buildRoundedPolygon(
  center: FixtureCoordinates,
  eastRadiusKilometers: number,
  northRadiusKilometers: number,
  vertices = 8,
): FixtureCoordinates[] {
  return Array.from({ length: vertices }, (_, index) => {
    const angle = (index / vertices) * Math.PI * 2;
    return offsetCoordinates(center, Math.cos(angle) * eastRadiusKilometers, Math.sin(angle) * northRadiusKilometers);
  });
}
