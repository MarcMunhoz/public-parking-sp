<template>
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
</template>

<script setup lang="ts">
defineProps<{
  navigationLink: string;
  mapPreviewUrl: string;
}>();
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
