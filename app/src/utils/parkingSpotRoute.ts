import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ParkingSpot } from 'src/components/models';

export const parseOsmType = (value: unknown): ParkingSpot['osmType'] | null => {
  if (value === 'node' || value === 'way' || value === 'relation') {
    return value;
  }

  return null;
};

export const toNumberOrNull = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const buildParkingSpotQuery = (
  spot: ParkingSpot,
  originLat?: string,
  originLng?: string
): LocationQueryRaw => ({
  osmType: spot.osmType,
  name: spot.name,
  address: spot.address,
  distance: spot.distanceLabel,
  hourPrice: spot.hourPrice,
  rating: String(spot.rating),
  availability: String(spot.availability),
  lat: String(spot.latitude),
  lng: String(spot.longitude),
  source: spot.source,
  originLat,
  originLng
});

export const parkingSpotFromQuery = (
  id: string,
  query: LocationQuery
): ParkingSpot | null => {
  const osmType = parseOsmType(query.osmType);
  const lat = toNumberOrNull(query.lat);
  const lng = toNumberOrNull(query.lng);
  const rating = toNumberOrNull(query.rating);
  const availability = toNumberOrNull(query.availability);

  if (!osmType || lat === null || lng === null) {
    return null;
  }

  return {
    id,
    osmType,
    name: String(query.name ?? 'parking sem nome'),
    address: String(query.address ?? 'Endereço não informado'),
    distanceMeters: 0,
    distanceLabel: String(query.distance ?? '---'),
    availability: availability ?? 0,
    rating: rating ?? 0,
    hourPrice: String(query.hourPrice ?? 'Consulte'),
    latitude: lat,
    longitude: lng,
    source: query.source === 'private' ? 'private' : 'public',
    tags: {}
  };
};
