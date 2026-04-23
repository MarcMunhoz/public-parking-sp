<template>
  <q-page class="q-py-md">
    <q-btn
      flat
      rounded
      no-caps
      icon="arrow_back"
      label="Voltar"
      class="q-mb-md text-slate-700"
      @click="router.back()"
    />

    <q-inner-loading :showing="isLoading" color="green-8" />

    <q-banner
      v-if="errorMessage"
      rounded
      class="q-mb-md bg-red-1 text-red-9"
    >
      {{ errorMessage }}
    </q-banner>

    <section v-if="spot" class="glass-panel q-pa-lg">
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-8">
          <p class="font-display text-h5 text-weight-bold text-slate-800 q-mb-xs">
            {{ spot.name }}
          </p>
          <p class="text-body2 text-slate-600 q-mb-md">
            {{ spot.address }}
          </p>

          <div class="row q-gutter-sm q-mb-md">
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

          <div class="row items-center q-gutter-xs q-mb-md">
            <q-rating
              :model-value="spot.rating"
              size="1.2em"
              icon="star"
              icon-selected="star"
              icon-half="star_half"
              color="orange-6"
              readonly
            />
            <span class="text-caption text-slate-600">({{ spot.rating.toFixed(1) }})</span>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-auto">
              <q-btn
                color="green-8"
                text-color="white"
                no-caps
                rounded
                unelevated
                icon="navigation"
                label="Navegar no mapa"
                :href="navigationLink"
                target="_blank"
              />
            </div>
            <div class="col-auto">
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
        </div>

        <div class="col-12 col-md-4">
          <div class="rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white q-pa-md q-mb-md">
            <p class="text-caption text-white/80 q-ma-none">Disponibilidade estimada</p>
            <p class="font-display text-h4 q-my-sm">{{ spot.availability }}</p>
            <p class="text-caption text-white/80 q-ma-none">vagas livres</p>
          </div>

          <q-list bordered separator class="rounded-borders bg-white/70">
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
import type { ParkingSpot } from 'src/components/models';
import { getParkingSpotById } from 'src/services/parkingApi';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const errorMessage = ref('');
const spot = ref<ParkingSpot | null>(null);

const navigationLink = computed(() => {
  if (!spot.value) {
    return '#';
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${spot.value.latitude},${spot.value.longitude}`;
});

function parseOsmType(value: unknown): ParkingSpot['osmType'] | null {
  // Accept only known OSM primitives used by Overpass queries.
  if (value === 'node' || value === 'way' || value === 'relation') {
    return value;
  }

  return null;
}

function toNumberOrNull(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function loadFromQuery(): ParkingSpot | null {
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
    name: String(route.query.name ?? 'Estacionamento sem nome'),
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
}

async function copyAddress() {
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
}

onMounted(async () => {
  const fromQuery = loadFromQuery();
  if (fromQuery) {
    spot.value = fromQuery;
    return;
  }

  // Fallback to API when the page is opened directly without query payload.
  const id = String(route.params.id);
  const osmType = parseOsmType(route.query.osmType);
  if (!osmType) {
    errorMessage.value = 'Dados insuficientes para carregar os detalhes deste estacionamento.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const loadedSpot = await getParkingSpotById(id, osmType);
    if (!loadedSpot) {
      errorMessage.value = 'Estacionamento não encontrado.';
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
