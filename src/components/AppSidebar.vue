<template>
  <v-navigation-drawer app color="primary" dark width="280">
    <v-list-item class="drawer-header pa-4">
      <div class="text-center w-100">
        <img src="/images/logos/logo-university-white.png" alt="Logo" height="60" class="mb-3" />
        <h6 class="text-h6 font-weight-bold text-white">Évaluation</h6>
      </div>
    </v-list-item>

    <v-divider color="white"></v-divider>
    
    <v-list nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        :to="item.to"
        :value="item.title"
        color="white"
        class="my-1"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon" color="white"></v-icon>
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const currentUser = ref(null);

// Charger les informations de l'utilisateur connecté
onMounted(async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser.value = data;
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil utilisateur:', error);
  }
});

// Menu items basés sur le rôle de l'utilisateur
const menuItems = computed(() => {
  const baseItems = [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/dashboard' },
    { title: 'Promotions', icon: 'mdi-school', to: '/promotions' },
    { title: 'Groupes', icon: 'mdi-account-multiple', to: '/groups' },
    { title: 'Sous-groupes', icon: 'mdi-account-supervisor', to: '/subgroups' },
    { title: 'Étudiants', icon: 'mdi-account-group', to: '/students' },
    { title: 'Formulaires', icon: 'mdi-file-document-outline', to: '/forms' },
    { title: 'Évaluations', icon: 'mdi-clipboard-check-outline', to: '/evaluations' },
    { title: 'Export CSV', icon: 'mdi-file-export', to: '/export' }
  ];

  // Ajouter la gestion des utilisateurs seulement pour les administrateurs
  if (currentUser.value?.role === 'admin') {
    baseItems.push({ title: 'Utilisateurs', icon: 'mdi-account-settings', to: '/users' });
  }

  return baseItems;
});
</script>

<style scoped>
.drawer-header {
  min-height: 150px;
}

.v-list-item {
  border-radius: 8px;
  margin: 0 8px;
}

.v-list-item--active {
  background-color: rgba(255, 255, 255, 0.15);
}
</style>
