import { createRouter, createWebHistory } from 'vue-router'
import ImportView from '../views/ImportView.vue'
import DashboardView from '../views/DashboardView.vue'
import PortfolioView from '../views/PortfolioView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'import', component: ImportView },
    { path: '/deals/:dealId', name: 'dashboard', component: DashboardView },
    { path: '/portfolio', name: 'portfolio', component: PortfolioView },
  ],
})

export default router
