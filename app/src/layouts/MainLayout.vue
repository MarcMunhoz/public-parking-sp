<template>
  <q-layout view="lHh Lpr lFf" class="font-body">
    <q-header class="bg-transparent q-px-md q-pt-md q-pb-sm">
      <q-toolbar class="glass-panel q-px-md q-py-sm">
        <q-avatar
          rounded
          size="40px"
          class="bg-emerald-900 text-white text-subtitle1"
        >
          P
        </q-avatar>

        <q-toolbar-title class="q-ml-sm">
          <p class="font-display text-subtitle1 text-weight-bold text-slate-800 q-ma-none">
            Public Parking SP
          </p>
          <p class="text-caption text-slate-600 q-ma-none">
            Encontre vagas públicas e privadas perto de você
          </p>
        </q-toolbar-title>

        <q-btn
          flat
          round
          icon="notifications"
          color="grey-8"
          aria-label="Alertas"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="q-px-md q-pb-xl">
      <router-view />
    </q-page-container>

  </q-layout>
</template>
