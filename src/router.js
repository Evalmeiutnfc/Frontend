import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import StudentsPage from './pages/StudentsPage.vue'
import GroupsPage from './pages/GroupsPage.vue'
import PromotionsPage from './pages/PromotionsPage.vue'
import SubGroupsPage from './pages/SubGroupsPage.vue'
import FormsPage from './pages/FormsPage.vue'
import EvaluationsPage from './pages/EvaluationsPage.vue'
import ExportPage from './pages/ExportPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/dashboard', component: DashboardPage },
  { path: '/students', component: StudentsPage },
  { path: '/groups', component: GroupsPage },
  { path: '/promotions', component: PromotionsPage },
  { path: '/subgroups', component: SubGroupsPage },
  { path: '/forms', component: FormsPage },
  { path: '/evaluations', component: EvaluationsPage },
  { path: '/export', component: ExportPage },
  { path: '/profile', component: ProfilePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔒 Middleware global : vérifie le token pour sécuriser les routes
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // Routes publiques accessibles sans être connecté
  const publicPages = ['/login', '/register']

  // Si c'est une route publique, permettre l'accès
  if (publicPages.includes(to.path)) {    
    // Si on va vers /login et qu'on est déjà connecté, rediriger vers dashboard
    if (to.path === '/login' && token) {
      return next('/dashboard')
    }
    
    // Pour toutes les autres routes publiques (y compris /register)
    return next()
  }

  // Si la route est protégée et qu'on n'a pas de token
  if (!token) {
    return next('/login')
  }

  // Sinon, continuer normalement
  next()
})

export default router
