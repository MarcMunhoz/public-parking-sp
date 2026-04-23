import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: { name: 'parking-by-address' } },
      {
        path: 'address',
        name: 'parking-by-address',
        component: () => import('pages/SearchByAddressPage.vue')
      },
      {
        path: 'parking/:id',
        name: 'parking-details',
        component: () => import('pages/ParkingDetailsPage.vue')
      }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
