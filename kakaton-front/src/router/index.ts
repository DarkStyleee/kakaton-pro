import { createRouter, createWebHistory } from 'vue-router';
import { RouteName, RouteNames } from '@/router/routes';
import HomePage from '@/views/HomePage';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: RouteNames[RouteName.HOME],
      name: RouteName.HOME,
      component: HomePage
    }
  ]
});

export default router;
