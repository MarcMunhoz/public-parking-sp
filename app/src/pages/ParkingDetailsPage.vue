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

          <ParkingMapPreview :navigation-link="navigationLink" :map-preview-url="mapPreviewUrl" />

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
import { useRouter } from 'vue-router';
import ParkingMapPreview from 'src/components/parking/ParkingMapPreview.vue';
import { useParkingDetails } from 'src/composables/useParkingDetails';

const router = useRouter();

const { isLoading, errorMessage, spot, navigationLink, mapPreviewUrl, copyAddress } =
  useParkingDetails();
</script>
