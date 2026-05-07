<template>
  <q-page class="tw:py-4">
    <q-btn
      flat
      rounded
      no-caps
      icon="arrow_back"
      label="Voltar"
      class="tw:mb-4 tw:text-slate-700"
      @click="router.back()"
    />

    <q-inner-loading :showing="isLoading" color="green-8" />

    <q-banner
      v-if="errorMessage"
      rounded
      class="tw:mb-4 tw:bg-red-100 tw:text-red-900"
    >
      {{ errorMessage }}
    </q-banner>

    <section v-if="spot" class="glass-panel tw:p-6">
      <div class="tw:grid tw:grid-cols-1 tw:gap-6 tw:md:grid-cols-12">
        <div class="tw:md:col-span-8">
          <p class="tw:mb-1 tw:font-display tw:text-4xl tw:font-bold tw:text-slate-800">
            {{ spot.name }}
          </p>
          <p class="tw:mb-4 tw:text-base tw:text-slate-600">
            {{ spot.address }}
          </p>

          <div class="tw:mb-4 tw:flex tw:flex-wrap tw:gap-2">
            <q-badge rounded color="emerald-2" text-color="emerald-9">
              {{ spot.distanceLabel }}
            </q-badge>
            <q-badge rounded color="orange-2" text-color="orange-9">
              {{ spot.hourPrice }}/hora
            </q-badge>
            <q-badge
              rounded
              :color="spot.source === 'private' ? 'purple-2' : 'blue-2'"
              :text-color="spot.source === 'private' ? 'purple-9' : 'blue-9'"
            >
              {{ spot.source === 'private' ? 'Privado' : 'Público' }}
            </q-badge>
          </div>

          <div class="tw:mb-4 tw:flex tw:items-center tw:gap-1">
            <q-rating
              :model-value="spot.rating"
              size="1.2em"
              icon="star"
              icon-selected="star"
              icon-half="star_half"
              color="orange-6"
              readonly
            />
            <span class="tw:text-sm tw:text-slate-600">({{ spot.rating.toFixed(1) }})</span>
          </div>

          <a
            :href="navigationLink"
            target="_blank"
            rel="noopener noreferrer"
            class="map-preview tw:mb-4 tw:block"
            aria-label="Abrir navegação no mapa"
          >
            <iframe
              :src="mapPreviewUrl"
              class="map-preview__frame"
              title="Prévia do mapa do estacionamento"
              loading="lazy"
            />
            <div class="map-preview__overlay">
              <q-icon name="navigation" size="18px" />
              <span>Navegar no mapa</span>
            </div>
          </a>

          <div class="tw:flex tw:flex-wrap tw:gap-3">
            <q-btn
              outline
              color="orange-7"
              no-caps
              rounded
              icon="content_copy"
              label="Copiar endereço"
              @click="copyAddress"
            />
          </div>
        </div>

        <div class="tw:md:col-span-4 tw:md:self-center">
          <div class="tw:mb-4 tw:rounded-3xl tw:bg-gradient-to-br tw:from-emerald-800 tw:to-emerald-600 tw:p-4 tw:text-white">
            <p class="tw:m-0 tw:text-sm tw:text-white/80">Disponibilidade estimada</p>
            <p class="tw:my-2 tw:font-display tw:text-5xl">{{ spot.availability }}</p>
            <p class="tw:m-0 tw:text-sm tw:text-white/80">vagas livres</p>
          </div>

          <q-list bordered separator class="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white/70">
            <q-item>
              <q-item-section>
                <q-item-label caption>Tipo</q-item-label>
                <q-item-label>{{ spot.source === 'private' ? 'Privado' : 'Público' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Distância</q-item-label>
                <q-item-label>{{ spot.distanceLabel }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Faixa de preço</q-item-label>
                <q-item-label>{{ spot.hourPrice }}/hora</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import type { Coordinates, ParkingSpot } from 'src/components/models';
import { getParkingSpotById } from 'src/services/parkingApi';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const errorMessage = ref('');
const spot = ref<ParkingSpot | null>(null);
const queryOrigin = ref<Coordinates | null>(null);

const navigationLink = computed(() => {
  if (!spot.value) {
    return '#';
  }

  const destination = `${spot.value.latitude},${spot.value.longitude}`;
  if (!queryOrigin.value) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  const origin = `${queryOrigin.value.lat},${queryOrigin.value.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
});

const mapPreviewUrl = computed(() => {
  if (!spot.value) {
    return '';
  }

  const lat = spot.value.latitude;
  const lng = spot.value.longitude;
  const delta = 0.0032;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left},${bottom},${right},${top}`;
  const marker = `${lat},${lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
});

const parseOsmType = (value: unknown): ParkingSpot['osmType'] | null => {
  // Accept only known OSM primitives used by Overpass queries.
  if (value === 'node' || value === 'way' || value === 'relation') {
    return value;
  }

  return null;
};

const toNumberOrNull = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const loadFromQuery = (): ParkingSpot | null => {
  // Hydrate details directly from route query to avoid an extra network call.
  const id = String(route.params.id);
  const osmType = parseOsmType(route.query.osmType);
  const lat = toNumberOrNull(route.query.lat);
  const lng = toNumberOrNull(route.query.lng);
  const rating = toNumberOrNull(route.query.rating);
  const availability = toNumberOrNull(route.query.availability);

  if (!osmType || lat === null || lng === null) {
    return null;
  }

  return {
    id,
    osmType,
    name: String(route.query.name ?? 'parking sem nome'),
    address: String(route.query.address ?? 'Endereço não informado'),
    distanceMeters: 0,
    distanceLabel: String(route.query.distance ?? '---'),
    availability: availability ?? 0,
    rating: rating ?? 0,
    hourPrice: String(route.query.hourPrice ?? 'Consulte'),
    latitude: lat,
    longitude: lng,
    source: route.query.source === 'private' ? 'private' : 'public',
    tags: {}
  };
};

const copyAddress = async () => {
  if (!spot.value) {
    return;
  }

  if (!navigator.clipboard) {
    $q.notify({
      type: 'warning',
      message: 'Seu navegador não permite copiar automaticamente.'
    });
    return;
  }

  try {
    await navigator.clipboard.writeText(spot.value.address);
    $q.notify({
      type: 'positive',
      message: 'Endereço copiado.'
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível copiar o endereço.'
    });
  }
};

onMounted(async () => {
  const originLat = toNumberOrNull(route.query.originLat);
  const originLng = toNumberOrNull(route.query.originLng);
  queryOrigin.value =
    originLat === null || originLng === null
      ? null
      : { lat: originLat, lng: originLng };

  const fromQuery = loadFromQuery();
  if (fromQuery) {
    spot.value = fromQuery;
    return;
  }

  // Fallback to API when the page is opened directly without query payload.
  const id = String(route.params.id);
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
</script>

<style scoped>
.map-preview {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.map-preview__frame {
  display: block;
  width: 100%;
  height: 220px;
  border: 0;
  pointer-events: none;
}

.map-preview__overlay {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-weight: 600;
  padding: 8px 12px;
}
</style>
