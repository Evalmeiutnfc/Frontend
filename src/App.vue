<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from './components/AppNavbar.vue';
import AppSidebar from './components/AppSidebar.vue';

const router = useRouter();
const isAuthenticated = ref(false);
const isLoginPage = computed(() => router.currentRoute.value.path === '/login');
const isRegisterPage = computed(() => router.currentRoute.value.path === '/register');
const isPublicPage = computed(() => isLoginPage.value || isRegisterPage.value);

const checkAuth = () => {
  const token = localStorage.getItem('token');
  isAuthenticated.value = !!token;
  
  // Rediriger vers la page de login si non authentifié et pas sur une page publique
  if (!isAuthenticated.value && !isPublicPage.value) {
    router.push('/login');
  }
  
  // Rediriger vers le tableau de bord si déjà authentifié et sur la page de login
  if (isAuthenticated.value && isLoginPage.value) {
    router.push('/dashboard');
  }
};

watchEffect(() => {
  checkAuth();
});

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <v-app>
    <template v-if="!isPublicPage">
      <AppNavbar />
      <AppSidebar />
    </template>
    <v-main :class="{ 'public-page-main': isPublicPage }">
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
/* Styles globaux */
:root {
  --primary-color: #1976D2;
  --secondary-color: #FF5722;
  --error-color: #F44336;
  --success-color: #4CAF50;
  --warning-color: #FFC107;
  --background-color: #F5F5F5;
  --card-color: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #757575;
}

.v-main {
  min-height: 100vh;
  background: var(--background-color);
}

.public-page-main {
  min-height: 100vh;
  background: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
