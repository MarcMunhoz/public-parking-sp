import { computed, onMounted, ref } from 'vue';
import { Notify } from 'quasar';
import { useRoute } from 'vue-router';
import type { Coordinates, ParkingSpot } from 'src/components/models';
import { getParkingSpotById } from 'src/services/parkingApi';
import { buildNavigationLink, buildOsmEmbedPreviewUrl } from 'src/utils/maps';
import { parkingSpotFromQuery, parseOsmType, toNumberOrNull } from 'src/utils/parkingSpotRoute';

export const useParkingDetails = () => {
  const route = useRoute();
  const isLoading = ref(false);
  const errorMessage = ref('');
  const spot = ref<ParkingSpot | null>(null);
  const queryOrigin = ref<Coordinates | null>(null);

  const navigationLink = computed(() => {
    if (!spot.value) {
      return '#';
    }

    return buildNavigationLink(spot.value, queryOrigin.value);
  });

  const mapPreviewUrl = computed(() => {
    if (!spot.value) {
      return '';
    }

    return buildOsmEmbedPreviewUrl(spot.value);
  });

  const copyAddress = async () => {
    if (!spot.value) {
      return;
    }

    if (!navigator.clipboard) {
      Notify.create({
        type: 'warning',
        message: 'Seu navegador não permite copiar automaticamente.'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(spot.value.address);
      Notify.create({
        type: 'positive',
        message: 'Endereço copiado.'
      });
    } catch {
      Notify.create({
        type: 'negative',
        message: 'Não foi possível copiar o endereço.'
      });
    }
  };

  onMounted(async () => {
    const originLat = toNumberOrNull(route.query.originLat);
    const originLng = toNumberOrNull(route.query.originLng);
    queryOrigin.value =
      originLat === null || originLng === null ? null : { lat: originLat, lng: originLng };

    const id = String(route.params.id);
    const fromQuery = parkingSpotFromQuery(id, route.query);
    if (fromQuery) {
      spot.value = fromQuery;
      return;
    }

    const osmType = parseOsmType(route.query.osmType);
    if (!osmType) {
      errorMessage.value = 'Dados insuficientes para carregar os detalhes deste parking.';
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
      const loadedSpot = await getParkingSpotById(id, osmType);
      if (!loadedSpot) {
        errorMessage.value = 'parking não encontrado.';
        return;
      }

      spot.value = loadedSpot;
    } catch {
      errorMessage.value = 'Não foi possível carregar os detalhes agora.';
    } finally {
      isLoading.value = false;
    }
  });

  return {
    isLoading,
    errorMessage,
    spot,
    navigationLink,
    mapPreviewUrl,
    copyAddress
  };
};
