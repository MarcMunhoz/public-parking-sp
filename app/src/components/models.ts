export type Coordinates = {
  lat: number;
  lng: number;
};

export type ParkingSpot = {
  id: string;
  osmType: 'node' | 'way' | 'relation';
  name: string;
  address: string;
  distanceMeters: number;
  distanceLabel: string;
  availability: number;
  rating: number;
  hourPrice: string;
  latitude: number;
  longitude: number;
  source: 'public' | 'private';
  tags: Record<string, string>;
};
