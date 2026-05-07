<template>
  <q-page class="tw:py-4">
    <section class="glass-panel tw:p-6">
      <div class="tw:grid tw:grid-cols-1 tw:items-start tw:gap-4 tw:md:grid-cols-12">
        <div class="tw:md:col-span-7">
          <p class="tw:mb-1 tw:font-display tw:text-4xl tw:font-bold tw:text-slate-800">
            Buscar parking por endereço
          </p>
          <p class="tw:mb-4 tw:text-base tw:text-slate-600">
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
            class="tw:mb-2"
            @keyup.enter="searchByAddress"
          >
            <template #prepend>
              <q-icon name="place" color="orange-6" />
            </template>
          </q-input>

          <div class="tw:flex tw:flex-wrap tw:gap-3">
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

        <div class="tw:md:col-span-5">
          <div class="tw:rounded-3xl tw:bg-gradient-to-br tw:from-emerald-800 tw:to-emerald-600 tw:p-4 tw:text-white">
            <p class="tw:m-0 tw:text-sm tw:text-white/80">Disponibilidade em tempo real</p>
            <p class="tw:my-2 tw:font-display tw:text-3xl">{{ spots.length }} locais encontrados</p>
            <q-linear-progress
              color="orange-4"
              track-color="white"
              rounded
              size="12px"
              :value="progressValue"
              class="tw:mb-2"
            />
            <p class="tw:m-0 tw:text-sm tw:text-white/80">
              Atualizado para um raio de {{ radiusKm }} km
            </p>
          </div>
        </div>
      </div>

      <q-banner
        v-if="errorMessage"
        inline-actions
        rounded
        class="tw:mt-4 tw:bg-red-100 tw:text-red-900"
      >
        {{ errorMessage }}
      </q-banner>

      <q-banner
        v-if="locationInUseLabel"
        rounded
        class="tw:mt-2 tw:bg-blue-100 tw:text-blue-900"
      >
        Localização em uso: {{ locationInUseLabel }}
      </q-banner>
    </section>

    <section class="tw:mt-6">
      <div class="tw:mb-2 tw:flex tw:items-center tw:justify-between">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:text-slate-800">
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
        class="glass-panel tw:p-6 tw:text-center tw:text-slate-600"
      >
        Digite um endereço para consultar estacionamentos reais próximos.
      </q-card>

      <div class="tw:flex tw:flex-col tw:gap-4">
        <ParkingSpotCard
          v-for="spot in spots"
          :key="spot.id"
          :spot="spot"
          :navigation-link="navigationLink(spot)"
          @details="goToDetails"
        />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import ParkingSpotCard from 'src/components/parking/ParkingSpotCard.vue';
import { useParkingSearch } from 'src/composables/useParkingSearch';

const {
  address,
  isLoading,
  isLoadingLocation,
  errorMessage,
  spots,
  locationInUseLabel,
  radiusKm,
  progressValue,
  searchByAddress,
  useCurrentLocation,
  navigationLink,
  goToDetails
} = useParkingSearch();
</script>
