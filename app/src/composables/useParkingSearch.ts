import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Coordinates, ParkingSpot } from 'src/components/models';
import {
  geocodeAddress,
  reverseGeocodeAddress,
  searchNearbyParking
} from 'src/services/parkingApi';
import { buildNavigationLink } from 'src/utils/maps';
import { buildParkingSpotQuery } from 'src/utils/parkingSpotRoute';

type SearchState = {
  address: string;
  errorMessage: string;
  locationInUseLabel: string;
  currentOrigin: Coordinates | null;
  spots: ParkingSpot[];
};

const STORAGE_KEY = 'public-parking-search-state-v1';
const RADIUS_KM = 1.5;

export const useParkingSearch = () => {
  const router = useRouter();
  const address = ref('');
  const isLoading = ref(false);
  const isLoadingLocation = ref(false);
  const errorMessage = ref('');
  const spots = ref<ParkingSpot[]>([]);
  const locationInUseLabel = ref('');
  const currentOrigin = ref<Coordinates | null>(null);

  const progressValue = computed(() => {
    if (spots.value.length === 0) {
      return 0.15;
    }

    return Math.min(1, spots.value.length / 30);
  });

  const persistState = () => {
    const payload: SearchState = {
      address: address.value,
      errorMessage: errorMessage.value,
      locationInUseLabel: locationInUseLabel.value,
      currentOrigin: currentOrigin.value,
      spots: spots.value
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const restoreState = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SearchState>;
      address.value = typeof parsed.address === 'string' ? parsed.address : '';
      errorMessage.value = typeof parsed.errorMessage === 'string' ? parsed.errorMessage : '';
      locationInUseLabel.value =
        typeof parsed.locationInUseLabel === 'string' ? parsed.locationInUseLabel : '';
      const parsedOrigin = parsed.currentOrigin;
      currentOrigin.value =
        parsedOrigin &&
        typeof parsedOrigin === 'object' &&
        typeof parsedOrigin.lat === 'number' &&
        typeof parsedOrigin.lng === 'number'
          ? parsedOrigin
          : null;
      spots.value = Array.isArray(parsed.spots) ? parsed.spots : [];
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadNearby = async (origin: Coordinates) => {
    spots.value = await searchNearbyParking(origin, Math.round(RADIUS_KM * 1000));
    persistState();
  };

  const searchByAddress = async () => {
    const trimmedAddress = address.value.trim();
    errorMessage.value = '';

    if (!trimmedAddress) {
      errorMessage.value = 'Informe um endereço para iniciar a busca.';
      persistState();
      return;
    }

    isLoading.value = true;

    try {
      const coordinates = await geocodeAddress(trimmedAddress);
      if (!coordinates) {
        spots.value = [];
        errorMessage.value =
          'Não encontramos esse endereço em São Paulo. Tente um endereço mais completo.';
        persistState();
        return;
      }

      currentOrigin.value = coordinates;
      locationInUseLabel.value = trimmedAddress;
      await loadNearby(coordinates);
    } catch {
      spots.value = [];
      errorMessage.value = 'Não foi possível consultar a API de estacionamentos agora.';
      persistState();
    } finally {
      isLoading.value = false;
    }
  };

  const useCurrentLocation = async () => {
    errorMessage.value = '';
    if (!navigator.geolocation) {
      errorMessage.value = 'Seu navegador não suporta geolocalização.';
      persistState();
      return;
    }

    isLoadingLocation.value = true;

    try {
      const coordinates = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
          reject,
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      const reverseAddress = await reverseGeocodeAddress(coordinates);
      currentOrigin.value = coordinates;
      locationInUseLabel.value =
        reverseAddress ?? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;

      await loadNearby(coordinates);
    } catch {
      errorMessage.value = 'Não foi possível obter sua localização atual.';
      persistState();
    } finally {
      isLoadingLocation.value = false;
    }
  };

  const navigationLink = (spot: ParkingSpot): string =>
    buildNavigationLink(spot, currentOrigin.value);

  const goToDetails = (spot: ParkingSpot) => {
    persistState();
    const originLat = currentOrigin.value ? String(currentOrigin.value.lat) : undefined;
    const originLng = currentOrigin.value ? String(currentOrigin.value.lng) : undefined;

    void router.push({
      name: 'parking-details',
      params: { id: spot.id },
      query: buildParkingSpotQuery(spot, originLat, originLng)
    });
  };

  onMounted(() => {
    restoreState();
  });

  return {
    address,
    isLoading,
    isLoadingLocation,
    errorMessage,
    spots,
    locationInUseLabel,
    radiusKm: RADIUS_KM,
    progressValue,
    searchByAddress,
    useCurrentLocation,
    navigationLink,
    goToDetails
  };
};
