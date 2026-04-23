import type { Coordinates, ParkingSpot } from 'src/components/models';
import { apiConnections, requestNominatim, requestOverpass } from 'boot/api';

type NominatimEntry = {
  lat: string;
  lon: string;
  display_name?: string;
};

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(origin: Coordinates, target: Coordinates): number {
  // Haversine formula over a spherical Earth approximation.
  const earthRadius = 6371000;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(target.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function parseAddress(tags: Record<string, string>): string {
  const street = tags['addr:street'];
  const houseNumber = tags['addr:housenumber'];
  const neighborhood = tags['addr:suburb'] || tags['addr:neighbourhood'];
  const city = tags['addr:city'] || tags.town || tags.village;

  const streetLine = [street, houseNumber].filter(Boolean).join(', ');
  const regionLine = [neighborhood, city].filter(Boolean).join(' - ');
  const fallback = tags.operator || tags.description || '';

  return [streetLine, regionLine].filter(Boolean).join(' | ') || fallback;
}

function buildName(element: OverpassElement, tags: Record<string, string>): string {
  if (tags.name) {
    return tags.name;
  }

  if (tags.operator) {
    return `Estacionamento ${tags.operator}`;
  }

  const access = tags.access === 'private' ? 'Privado' : 'Público';
  return `Estacionamento ${access}`;
}

function toHourPrice(tags: Record<string, string>): string {
  const fee = tags.fee?.trim();
  if (!fee || fee.toLowerCase() === 'no') {
    return 'Grátis';
  }

  if (fee.toLowerCase() === 'yes') {
    return 'Consulte';
  }

  return fee;
}

function toAvailability(tags: Record<string, string>, id: number): number {
  const capacity = Number(tags.capacity);
  if (Number.isFinite(capacity) && capacity > 0) {
    // Conservative estimate of free spots based on declared capacity.
    return Math.max(1, Math.round(capacity * 0.35));
  }

  // Stable pseudo-random fallback to keep the UI deterministic.
  return 8 + (id % 37);
}

function toRating(id: number): number {
  return Number((3.6 + (id % 14) / 10).toFixed(1));
}

function mapElementToParkingSpot(element: OverpassElement, origin: Coordinates): ParkingSpot | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};

  if (lat === undefined || lng === undefined) {
    return null;
  }

  const distanceMeters = calculateDistanceMeters(origin, { lat, lng });

  return {
    id: String(element.id),
    osmType: element.type,
    name: buildName(element, tags),
    address: parseAddress(tags),
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    availability: toAvailability(tags, element.id),
    rating: toRating(element.id),
    hourPrice: toHourPrice(tags),
    latitude: lat,
    longitude: lng,
    source: tags.access === 'private' || tags.private === 'yes' ? 'private' : 'public',
    tags
  };
}

export async function reverseGeocodeAddress(coordinates: Coordinates): Promise<string | null> {
  const url = new URL(apiConnections.nominatimReverseUrl);
  url.searchParams.set('lat', String(coordinates.lat));
  url.searchParams.set('lon', String(coordinates.lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const response = await requestNominatim(url);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  if (data.address) {
    const street =
      data.address.road ||
      data.address.pedestrian ||
      data.address.footway ||
      data.address.cycleway;
    const houseNumber = data.address.house_number;
    const neighborhood =
      data.address.suburb ||
      data.address.neighbourhood ||
      data.address.city_district;
    const city = data.address.city || data.address.town || data.address.village;

    const line1 = [street, houseNumber].filter(Boolean).join(', ');
    const line2 = [neighborhood, city].filter(Boolean).join(' - ');
    const parsed = [line1, line2].filter(Boolean).join(' | ');
    if (parsed) {
      return parsed;
    }
  }

  return data.display_name ?? null;
}

async function enrichMissingAddresses(spots: ParkingSpot[]): Promise<ParkingSpot[]> {
  const missingAddressIndexes = spots
    .map((spot, index) => ({ spot, index }))
    .filter(({ spot }) => !spot.address.trim())
    .slice(0, 10);
  // Limit reverse geocoding calls to reduce latency and API pressure.

  if (missingAddressIndexes.length === 0) {
    return spots;
  }

  const resolvedAddresses = await Promise.all(
    missingAddressIndexes.map(({ spot }) =>
      reverseGeocodeAddress({ lat: spot.latitude, lng: spot.longitude })
    )
  );

  const result = [...spots];
  missingAddressIndexes.forEach(({ index }, position) => {
    const currentSpot = result[index];
    if (!currentSpot) {
      return;
    }

    result[index] = {
      ...currentSpot,
      address: resolvedAddresses[position] ?? 'Endereço não informado'
    };
  });

  return result;
}

function buildNearbyQuery(origin: Coordinates, radiusMeters: number): string {
  // Query parking as node/way/relation in one round-trip.
  return `
    [out:json][timeout:25];
    (
      node["amenity"="parking"](around:${radiusMeters},${origin.lat},${origin.lng});
      way["amenity"="parking"](around:${radiusMeters},${origin.lat},${origin.lng});
      relation["amenity"="parking"](around:${radiusMeters},${origin.lat},${origin.lng});
    );
    out center tags;
  `;
}

function buildByIdQuery(osmType: ParkingSpot['osmType'], id: string): string {
  return `
    [out:json][timeout:20];
    ${osmType}(${id});
    out center tags;
  `;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const url = new URL(apiConnections.nominatimSearchUrl);
  url.searchParams.set('q', `${address}, São Paulo, Brasil`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const response = await requestNominatim(url);

  if (!response.ok) {
    throw new Error('Falha ao geocodificar endereço.');
  }

  const data = (await response.json()) as NominatimEntry[];
  const first = data[0];

  if (!first) {
    return null;
  }

  return {
    lat: Number(first.lat),
    lng: Number(first.lon)
  };
}

export async function searchNearbyParking(
  origin: Coordinates,
  radiusMeters = 1500
): Promise<ParkingSpot[]> {
  const response = await requestOverpass(buildNearbyQuery(origin, radiusMeters));

  if (!response.ok) {
    throw new Error('Falha ao consultar estacionamentos.');
  }

  const payload = (await response.json()) as OverpassResponse;
  const spots = (payload.elements ?? [])
    .map((element) => mapElementToParkingSpot(element, origin))
    .filter((spot): spot is ParkingSpot => spot !== null)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);

  // Address enrichment runs after sorting so the list order stays stable.
  return enrichMissingAddresses(spots);
}

export async function getParkingSpotById(
  id: string,
  osmType: ParkingSpot['osmType'],
  origin?: Coordinates
): Promise<ParkingSpot | null> {
  const response = await requestOverpass(buildByIdQuery(osmType, id));

  if (!response.ok) {
    throw new Error('Falha ao carregar detalhes do estacionamento.');
  }

  const payload = (await response.json()) as OverpassResponse;
  const element = payload.elements?.[0];

  if (!element) {
    return null;
  }

  const fallbackOrigin: Coordinates = origin ?? {
    // Use element coordinates (or São Paulo center) when no origin is provided.
    lat: element.lat ?? element.center?.lat ?? -23.5505,
    lng: element.lon ?? element.center?.lon ?? -46.6333
  };

  const mapped = mapElementToParkingSpot(element, fallbackOrigin);
  if (!mapped) {
    return null;
  }

  if (!mapped.address.trim()) {
    const resolvedAddress = await reverseGeocodeAddress({
      lat: mapped.latitude,
      lng: mapped.longitude
    });
    mapped.address = resolvedAddress ?? 'Endereço não informado';
  }

  return mapped;
}
