import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import StudentsPage from './pages/StudentsPage.vue'
import FormsPage from './pages/FormsPage.vue'
import EvaluationsPage from './pages/EvaluationsPage.vue'
import ExportPage from './pages/ExportPage.vue'

const routes = [
  // { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/dashboard', component: DashboardPage },
  { path: '/students', component: StudentsPage },
  { path: '/forms', component: FormsPage },
  { path: '/evaluations', component: EvaluationsPage },
  { path: '/export', component: ExportPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔒 Middleware global : vérifie le token pour sécuriser les routes
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  console.log('Navigation vers:', to.path)
  console.log('Token présent:', token)

  // Routes publiques accessibles sans être connecté
  const publicPages = ['/login', '/register']

  console.log('Token détecté:', token);
  console.log('Route demandée:', to.path);
  console.log('Routes publiques:', publicPages);

  if (publicPages.includes(to.path)) {
    console.log('Route publique détectée:', to.path)

    // Permettre l'accès à /register sans redirection
    if (to.path === '/register') {
      console.log('Accès à /register autorisé')
      return next()
    }

    // Si connecté, éviter d'accéder à /login
    if (to.path === '/login' && token) {
      console.log('Redirection vers /dashboard car déjà connecté')
      return next('/dashboard')
    }

    console.log('Accès à une route publique autorisé')
    return next()
  }

  // Si la route est protégée et qu'on n'a pas de token
  if (!token) {
    console.log('Redirection vers /login car token manquant')
    return next('/login')
  }

  // Sinon, continuer normalement
  console.log('Accès à une route protégée autorisé')
  next()
})

export default router
