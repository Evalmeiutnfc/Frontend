<template>
  <v-container fluid class="dashboard-container pa-4">
    <!-- Indicateur de chargement -->
    <v-overlay :model-value="loading" class="align-center justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
    </v-overlay>
    
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-6">Tableau de bord</h2>
      </v-col>
    </v-row>

    <v-row>
      <!-- Carte des statistiques -->
      <v-col cols="12" md="4">
        <v-card class="rounded-lg">
          <v-card-title class="primary text-white pa-4">
            <v-icon large color="white" class="mr-2">mdi-account-group</v-icon>
            Étudiants
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="text-h3 font-weight-bold text-center py-4">{{ stats.students }}</div>
            <p class="text-subtitle-1 text-center">étudiants enregistrés</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg">
          <v-card-title class="error text-white pa-4">
            <v-icon large color="white" class="mr-2">mdi-file-document-outline</v-icon>
            Formulaires
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="text-h3 font-weight-bold text-center py-4">{{ stats.forms }}</div>
            <p class="text-subtitle-1 text-center">formulaires créés</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg">
          <v-card-title class="success text-white pa-4">
            <v-icon large color="white" class="mr-2">mdi-clipboard-check-outline</v-icon>
            Évaluations
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="text-h3 font-weight-bold text-center py-4">{{ stats.evaluations }}</div>
            <p class="text-subtitle-1 text-center">évaluations complétées</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card class="rounded-lg">
          <v-card-title class="pa-4">
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Évaluations récentes
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item v-for="(evaluation, index) in recentEvaluations" :key="index" link>
                <template v-slot:prepend>
                  <v-avatar color="primary" class="text-white">{{ evaluation.student.charAt(0) }}</v-avatar>
                </template>
                <v-list-item-title>{{ evaluation.student }}</v-list-item-title>
                <v-list-item-subtitle>{{ evaluation.form }} | {{ evaluation.date }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="rounded-lg">
          <v-card-title class="pa-4">
            <v-icon class="mr-2">mdi-bell-outline</v-icon>
            Activités à venir
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item v-for="(activity, index) in upcomingActivities" :key="index" link>
                <template v-slot:prepend>
                  <v-icon :color="activity.color">{{ activity.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Données statistiques
const stats = ref({
  students: 0,
  forms: 0,
  evaluations: 0
});

const recentEvaluations = ref([]);
const upcomingActivities = ref([]);
const loading = ref(true); // État de chargement

onMounted(async () => {
  // Récupérer les données depuis l'API
  try {
    // Récupérer les statistiques
    const statsResponse = await fetch('http://localhost:5000/api/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (statsResponse.ok) {
      stats.value = await statsResponse.json();
    }

    // Récupérer les évaluations récentes
    const evaluationsResponse = await fetch('http://localhost:5000/api/evaluations/recent', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (evaluationsResponse.ok) {
      recentEvaluations.value = await evaluationsResponse.json();
    } else {
      // Données fictives pour démonstration
      recentEvaluations.value = [
        { student: 'Martin Dupont', form: 'Évaluation de stage', date: '25 juin 2025' },
        { student: 'Sophie Martin', form: 'Rapport de projet', date: '28 juin 2025' },
        { student: 'Lucas Bernard', form: 'Soutenance finale', date: '29 juin 2025' }
      ];
    }

    // Récupérer les activités à venir
    const activitiesResponse = await fetch('http://localhost:5000/api/activities/upcoming', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (activitiesResponse.ok) {
      upcomingActivities.value = await activitiesResponse.json();
    } else {
      // Données fictives pour démonstration en cas d'erreur
      upcomingActivities.value = [
        { title: 'Soutenances BUT', description: '5 juillet 2025', icon: 'mdi-calendar', color: 'primary' },
        { title: 'Évaluations à finaliser', description: '3 rapports en attente', icon: 'mdi-alert-circle', color: 'warning' },
        { title: 'Réunion pédagogique', description: '10 juillet 2025', icon: 'mdi-account-group', color: 'info' }
      ];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    
    // Afficher une notification d'erreur
    alert("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
    
    // Données fictives en cas d'erreur pour permettre l'affichage
    stats.value = { students: 0, forms: 0, evaluations: 0 };
    
    recentEvaluations.value = [];
    upcomingActivities.value = [];
  } finally {
    // Désactiver l'indicateur de chargement
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard-container {
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}
</style>
