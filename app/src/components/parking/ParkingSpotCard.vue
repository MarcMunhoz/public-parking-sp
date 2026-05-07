<template>
  <q-card flat class="glass-panel tw:p-2">
    <q-card-section class="tw:grid tw:grid-cols-12 tw:items-center tw:gap-4">
      <div class="tw:col-span-8 tw:sm:col-span-9">
        <p class="tw:m-0 tw:text-xl tw:font-bold tw:text-slate-800">
          {{ spot.name }}
        </p>
        <p class="tw:mb-2 tw:mt-1 tw:text-sm tw:text-slate-600">
          {{ spot.address }}
        </p>
        <div class="tw:flex tw:items-center tw:gap-2">
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

      <div class="tw:col-span-4 tw:text-right tw:sm:col-span-3">
        <q-badge
          :color="spot.availability > 20 ? 'emerald-7' : 'orange-7'"
          class="tw:mb-2"
        >
          {{ spot.availability }} vagas
        </q-badge>
        <div class="tw:flex tw:justify-end tw:gap-1">
          <q-btn
            flat
            dense
            round
            icon="info"
            color="grey-8"
            aria-label="Detalhes"
            @click="$emit('details', spot)"
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
            :href="navigationLink"
            target="_blank"
          >
            <q-tooltip>Abrir rota no mapa</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { ParkingSpot } from 'src/components/models';

defineProps<{
  spot: ParkingSpot;
  navigationLink: string;
}>();

defineEmits<{
  details: [spot: ParkingSpot];
}>();
</script>
