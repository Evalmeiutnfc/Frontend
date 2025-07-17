<template>
  <v-app-bar app color="white" flat elevation="1">
    <div class="d-flex align-center">
      <img src="/images/logos/logo-university.png" alt="Logo" height="40" class="mr-2" />
      <v-toolbar-title class="text-primary font-weight-bold">Plateforme d'évaluation</v-toolbar-title>
    </div>
    
    <v-spacer />
    
    <div class="d-flex align-center">
      <v-btn icon class="mr-2">
        <v-icon>mdi-bell</v-icon>
      </v-btn>
      <v-btn icon class="mr-2">
        <v-icon>mdi-message</v-icon>
      </v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn class="text-none" v-bind="props">
            <v-avatar size="32" class="mr-2">
              <v-img src="/images/logos/avatar.png" alt="Avatar"></v-img>
            </v-avatar>
            {{ username }}
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="viewProfile">
            <template v-slot:prepend>
              <v-icon>mdi-account-circle</v-icon>
            </template>
            <v-list-item-title>Mon profil</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="logout">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Déconnexion</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('Utilisateur');

onMounted(() => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    username.value = userData.username || 'Utilisateur';
  }
});

const viewProfile = () => {
  // Rediriger vers la page de profil
  router.push('/profile');
};

const logout = () => {
  // Supprimer le token et les infos utilisateur
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Rediriger vers la page de connexion
  router.push('/login');
};
</script>

<style scoped>
.v-toolbar-title {
  font-size: 1.2rem;
}
</style>
