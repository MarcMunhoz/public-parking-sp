import type { Coordinates, ParkingSpot } from 'src/components/models';

export const buildNavigationLink = (
  destinationSpot: Pick<ParkingSpot, 'latitude' | 'longitude'>,
  origin: Coordinates | null
): string => {
  const destination = `${destinationSpot.latitude},${destinationSpot.longitude}`;
  if (!origin) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  const originLabel = `${origin.lat},${origin.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${originLabel}&destination=${destination}`;
};

export const buildOsmEmbedPreviewUrl = (
  destinationSpot: Pick<ParkingSpot, 'latitude' | 'longitude'>
): string => {
  const lat = destinationSpot.latitude;
  const lng = destinationSpot.longitude;
  const delta = 0.0032;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left},${bottom},${right},${top}`;
  const marker = `${lat},${lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
};
