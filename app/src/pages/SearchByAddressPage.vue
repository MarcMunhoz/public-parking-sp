<template>
  <q-page class="q-py-md">
    <section class="glass-panel q-pa-lg">
      <div class="row items-start q-col-gutter-md">
        <div class="col-12 col-md-7">
          <p class="font-display text-h5 text-weight-bold text-slate-800 q-mb-xs">
            Buscar estacionamento por endereço
          </p>
          <p class="text-body2 text-slate-600 q-mb-md">
            Digite rua, bairro ou ponto de referência para consultar vagas próximas.
          </p>

          <q-input
            v-model="address"
            outlined
            rounded
            dense
            color="green-8"
            bg-color="white"
            label="Ex: Avenida Paulista, 1000"
            class="q-mb-sm"
            @keyup.enter="searchByAddress"
          >
            <template #prepend>
              <q-icon name="place" color="orange-6" />
            </template>
          </q-input>

          <div class="row q-col-gutter-sm">
            <div class="col-auto">
              <q-btn
                color="green-8"
                text-color="white"
                unelevated
                no-caps
                rounded
                icon="search"
                label="Buscar vagas"
                :loading="isLoading"
                @click="searchByAddress"
              />
            </div>
            <div class="col-auto">
              <q-btn
                outline
                color="orange-7"
                no-caps
                rounded
                icon="near_me"
                label="Usar localização"
                :loading="isLoadingLocation"
                @click="useCurrentLocation"
              />
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5">
          <div class="rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white q-pa-md">
            <p class="text-caption text-white/80 q-ma-none">Disponibilidade em tempo real</p>
            <p class="font-display text-h6 q-my-sm">{{ spots.length }} locais encontrados</p>
            <q-linear-progress
              color="orange-4"
              track-color="white"
              rounded
              size="12px"
              :value="progressValue"
              class="q-mb-sm"
            />
            <p class="text-caption text-white/80 q-ma-none">
              Atualizado para um raio de {{ radiusKm }} km
            </p>
          </div>
        </div>
      </div>

      <q-banner
        v-if="errorMessage"
        inline-actions
        rounded
        class="q-mt-md bg-red-1 text-red-9"
      >
        {{ errorMessage }}
      </q-banner>

      <q-banner
        v-if="locationInUseLabel"
        rounded
        class="q-mt-sm bg-blue-1 text-blue-9"
      >
        Localização em uso: {{ locationInUseLabel }}
      </q-banner>
    </section>

    <section class="q-mt-lg">
      <div class="row items-center justify-between q-mb-sm">
        <p class="font-display text-subtitle1 text-weight-bold text-slate-800 q-ma-none">
          Estacionamentos encontrados
        </p>
        <q-chip color="orange-2" text-color="orange-9" icon="tune" square>
          Filtro: até {{ radiusKm }} km
        </q-chip>
      </div>

      <q-inner-loading :showing="isLoading" color="green-8" />

      <q-card
        v-if="!isLoading && spots.length === 0"
        flat
        class="glass-panel q-pa-lg text-center text-slate-600"
      >
        Digite um endereço para consultar estacionamentos reais próximos.
      </q-card>

      <div class="column q-gutter-md">
        <q-card
          v-for="spot in spots"
          :key="spot.id"
          flat
          class="glass-panel q-pa-sm"
        >
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-8 col-sm-9">
              <p class="text-subtitle1 text-weight-bold text-slate-800 q-ma-none">
                {{ spot.name }}
              </p>
              <p class="text-caption text-slate-600 q-mt-xs q-mb-sm">
                {{ spot.address }}
              </p>
              <div class="row items-center q-gutter-sm">
                <q-badge rounded color="emerald-2" text-color="emerald-9">
                  {{ spot.distanceLabel }}
                </q-badge>
                <q-badge rounded color="orange-2" text-color="orange-9">
                  {{ spot.hourPrice }}/hora
                </q-badge>
                <q-rating
                  :model-value="spot.rating"
                  size="1em"
                  icon="star"
                  icon-selected="star"
                  icon-half="star_half"
                  color="orange-6"
                  readonly
                />
              </div>
            </div>

            <div class="col-4 col-sm-3 text-right">
              <q-badge
                :color="spot.availability > 20 ? 'emerald-7' : 'orange-7'"
                class="q-mb-sm"
              >
                {{ spot.availability }} vagas
              </q-badge>
              <div class="row justify-end q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="info"
                  color="grey-8"
                  aria-label="Detalhes"
                  @click="goToDetails(spot)"
                >
                  <q-tooltip>Detalhes</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="navigation"
                  color="grey-8"
                  aria-label="Navegar"
                  :href="navigationLink(spot)"
                  target="_blank"
                >
                  <q-tooltip>Abrir rota no mapa</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Coordinates, ParkingSpot } from 'src/components/models';
import {
  geocodeAddress,
  reverseGeocodeAddress,
  searchNearbyParking
} from 'src/services/parkingApi';

const router = useRouter();

const address = ref('');
const isLoading = ref(false);
const isLoadingLocation = ref(false);
const errorMessage = ref('');
const spots = ref<ParkingSpot[]>([]);
const locationInUseLabel = ref('');
const currentOrigin = ref<Coordinates | null>(null);

const radiusKm = 1.5;
const STORAGE_KEY = 'public-parking-search-state-v1';

type SearchState = {
  address: string;
  errorMessage: string;
  locationInUseLabel: string;
  currentOrigin: Coordinates | null;
  spots: ParkingSpot[];
};

const progressValue = computed(() => {
  if (spots.value.length === 0) {
    return 0.15;
  }

  return Math.min(1, spots.value.length / 30);
});

function navigationLink(spot: ParkingSpot): string {
  const destination = `${spot.latitude},${spot.longitude}`;
  if (!currentOrigin.value) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  const origin = `${currentOrigin.value.lat},${currentOrigin.value.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
}

function goToDetails(spot: ParkingSpot) {
  persistState();

  void router.push({
    name: 'parking-details',
    params: { id: spot.id },
    query: {
      osmType: spot.osmType,
      name: spot.name,
      address: spot.address,
      distance: spot.distanceLabel,
      hourPrice: spot.hourPrice,
      rating: String(spot.rating),
      availability: String(spot.availability),
      lat: String(spot.latitude),
      lng: String(spot.longitude),
      source: spot.source
    }
  });
}

async function loadNearby(origin: Coordinates) {
  // Overpass API expects radius in meters.
  spots.value = await searchNearbyParking(origin, Math.round(radiusKm * 1000));
  persistState();
}

function persistState() {
  // Keep the last search context when navigating to details and back.
  const payload: SearchState = {
    address: address.value,
    errorMessage: errorMessage.value,
    locationInUseLabel: locationInUseLabel.value,
    currentOrigin: currentOrigin.value,
    spots: spots.value
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreState() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    // Runtime guards avoid invalid restored payloads from old/corrupted sessions.
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
}

async function searchByAddress() {
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
      errorMessage.value = 'Não encontramos esse endereço em São Paulo. Tente um endereço mais completo.';
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
}

async function useCurrentLocation() {
  errorMessage.value = '';
  if (!navigator.geolocation) {
    errorMessage.value = 'Seu navegador não suporta geolocalização.';
    persistState();
    return;
  }

  isLoadingLocation.value = true;

  try {
    // Wrap callback-based geolocation API into a Promise for async/await flow.
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
      reverseAddress ??
      `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;

    await loadNearby(coordinates);
  } catch {
    errorMessage.value = 'Não foi possível obter sua localização atual.';
    persistState();
  } finally {
    isLoadingLocation.value = false;
  }
}

onMounted(() => {
  restoreState();
});
</script>
