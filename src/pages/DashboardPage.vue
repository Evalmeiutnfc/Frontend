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
    
    <!-- En-tête avec informations utilisateur -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="rounded-lg" color="primary" variant="flat">
          <v-card-text class="pa-6">
            <div class="d-flex align-center text-white">
              <v-avatar size="64" color="white" class="mr-4">
                <v-icon size="32" color="primary">mdi-account-circle</v-icon>
              </v-avatar>
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">
                  Bienvenue, {{ currentUser?.firstName }} {{ currentUser?.lastName }}
                </h1>
                <p class="text-h6 mb-0 opacity-90">
                  <v-chip size="small" color="white" variant="flat" class="text-primary font-weight-bold">
                    {{ getRoleLabel(currentUser?.role) }}
                  </v-chip>
                  <span class="ml-2">{{ getCurrentDate() }}</span>
                </p>
              </div>
              <v-spacer />
              <v-icon size="48" class="opacity-50">mdi-view-dashboard</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistiques principales -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg elevation-2" hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-avatar size="56" color="primary" class="mr-4">
                <v-icon size="28" color="white">mdi-account-group</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-primary">{{ stats.students }}</div>
                <div class="text-subtitle-1 text-medium-emphasis">Étudiants</div>
              </div>
            </div>
            <v-progress-linear
              :model-value="getProgressValue('students')"
              color="primary"
              height="4"
              rounded
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg elevation-2" hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-avatar size="56" color="orange" class="mr-4">
                <v-icon size="28" color="white">mdi-file-document-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-orange">{{ stats.forms }}</div>
                <div class="text-subtitle-1 text-medium-emphasis">Formulaires</div>
              </div>
            </div>
            <v-progress-linear
              :model-value="getProgressValue('forms')"
              color="orange"
              height="4"
              rounded
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg elevation-2" hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-avatar size="56" color="success" class="mr-4">
                <v-icon size="28" color="white">mdi-clipboard-check-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-success">{{ stats.evaluations }}</div>
                <div class="text-subtitle-1 text-medium-emphasis">Évaluations</div>
              </div>
            </div>
            <v-progress-linear
              :model-value="getProgressValue('evaluations')"
              color="success"
              height="4"
              rounded
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg elevation-2" hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-avatar size="56" color="info" class="mr-4">
                <v-icon size="28" color="white">mdi-school</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-info">{{ stats.promotions }}</div>
                <div class="text-subtitle-1 text-medium-emphasis">Promotions</div>
              </div>
            </div>
            <v-progress-linear
              :model-value="getProgressValue('promotions')"
              color="info"
              height="4"
              rounded
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistiques administrateur uniquement -->
    <v-row v-if="isAdmin" class="mb-6">
      <v-col cols="12">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="warning" class="mr-3">mdi-shield-crown</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Statistiques Administrateur</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Données réservées aux administrateurs</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <div class="text-center">
                  <v-avatar size="72" color="purple" class="mb-3">
                    <v-icon size="36" color="white">mdi-account-multiple</v-icon>
                  </v-avatar>
                  <div class="text-h3 font-weight-bold text-purple">{{ userStats?.total || 0 }}</div>
                  <div class="text-subtitle-1 text-medium-emphasis">Total Utilisateurs</div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="text-center">
                  <v-avatar size="72" color="teal" class="mb-3">
                    <v-icon size="36" color="white">mdi-account-tie</v-icon>
                  </v-avatar>
                  <div class="text-h3 font-weight-bold text-teal">{{ userStats?.professors || 0 }}</div>
                  <div class="text-subtitle-1 text-medium-emphasis">Professeurs</div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="text-center">
                  <v-avatar size="72" color="red" class="mb-3">
                    <v-icon size="36" color="white">mdi-shield-account</v-icon>
                  </v-avatar>
                  <div class="text-h3 font-weight-bold text-red">{{ userStats?.admins || 0 }}</div>
                  <div class="text-subtitle-1 text-medium-emphasis">Administrateurs</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Graphiques et analyses détaillées -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="primary" class="mr-3">mdi-chart-line</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Activité d'évaluation</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Évolution des évaluations sur 6 mois</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <div v-if="evaluationTrends.length > 0">
              <v-row>
                <v-col 
                  v-for="(trend, index) in evaluationTrends" 
                  :key="index"
                  cols="12" 
                  sm="6" 
                  md="4"
                >
                  <div class="text-center pa-3 border rounded">
                    <div class="text-h6 font-weight-bold text-primary">{{ trend.count }}</div>
                    <div class="text-caption text-medium-emphasis">{{ getMonthName(trend._id.month) }} {{ trend._id.year }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center pa-8 text-medium-emphasis">
              <v-icon size="48" class="mb-2">mdi-chart-line-variant</v-icon>
              <div>Données d'activité en cours de chargement...</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="success" class="mr-3">mdi-trophy</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Top Professeurs</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Les plus actifs</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-list v-if="topProfessors.length > 0">
              <v-list-item
                v-for="(professor, index) in topProfessors"
                :key="index"
                class="px-6 py-3"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getTrophyColor(index)" size="32" class="mr-3">
                    <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ professor.professorName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ professor.count }} évaluation{{ professor.count > 1 ? 's' : '' }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon v-if="index === 0" color="amber">mdi-trophy</v-icon>
                  <v-icon v-else-if="index === 1" color="grey">mdi-medal-outline</v-icon>
                  <v-icon v-else-if="index === 2" color="orange">mdi-medal-outline</v-icon>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center pa-6 text-medium-emphasis">
              <v-icon size="48" class="mb-2">mdi-trophy-outline</v-icon>
              <div>Aucune donnée disponible</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Analyse des formulaires -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="orange" class="mr-3">mdi-file-chart</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Analyse des formulaires</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Répartition par type</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <div v-if="formStats.active !== undefined">
              <v-row class="mb-4">
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">{{ formStats.active }}</div>
                    <div class="text-subtitle-2 text-medium-emphasis">Actifs</div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-error">{{ formStats.inactive }}</div>
                    <div class="text-subtitle-2 text-medium-emphasis">Inactifs</div>
                  </div>
                </v-col>
              </v-row>
              
              <div v-if="formsByType.length > 0">
                <h4 class="text-subtitle-1 font-weight-medium mb-3">Par type d'association</h4>
                <div v-for="type in formsByType" :key="type._id" class="mb-2">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-body-2">{{ getAssociationTypeLabel(type._id) }}</span>
                    <span class="text-body-2 font-weight-bold">{{ type.count }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="(type.count / stats.forms) * 100"
                    :color="getTypeColor(type._id)"
                    height="6"
                    rounded
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-center pa-4 text-medium-emphasis">
              Chargement des données...
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="info" class="mr-3">mdi-account-school</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Répartition des étudiants</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Par promotion</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <div v-if="studentsByPromotion.length > 0">
              <div v-for="promotion in studentsByPromotion.slice(0, 5)" :key="promotion._id" class="mb-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">{{ promotion.promotionName }}</span>
                  <span class="text-body-2 font-weight-bold">{{ promotion.count }} étudiant{{ promotion.count > 1 ? 's' : '' }}</span>
                </div>
                <v-progress-linear
                  :model-value="(promotion.count / stats.students) * 100"
                  color="info"
                  height="6"
                  rounded
                />
              </div>
              <div v-if="studentsByPromotion.length > 5" class="text-caption text-medium-emphasis text-center mt-3">
                +{{ studentsByPromotion.length - 5 }} autre{{ studentsByPromotion.length - 5 > 1 ? 's' : '' }} promotion{{ studentsByPromotion.length - 5 > 1 ? 's' : '' }}
              </div>
            </div>
            <div v-else class="text-center pa-4 text-medium-emphasis">
              Aucune donnée de promotion disponible
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!-- Actions rapides -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-2">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="purple" class="mr-3">mdi-lightning-bolt</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Actions rapides</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Raccourcis vers les fonctionnalités principales</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  to="/evaluations"
                  color="primary"
                  variant="outlined"
                  size="large"
                  block
                  class="pa-4"
                  prepend-icon="mdi-clipboard-plus"
                >
                  <div class="text-center">
                    <div class="font-weight-bold">Nouvelle</div>
                    <div class="text-caption">Évaluation</div>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  to="/forms"
                  color="orange"
                  variant="outlined"
                  size="large"
                  block
                  class="pa-4"
                  prepend-icon="mdi-file-document-plus"
                >
                  <div class="text-center">
                    <div class="font-weight-bold">Créer</div>
                    <div class="text-caption">Formulaire</div>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  to="/students"
                  color="success"
                  variant="outlined"
                  size="large"
                  block
                  class="pa-4"
                  prepend-icon="mdi-account-group"
                >
                  <div class="text-center">
                    <div class="font-weight-bold">Gérer</div>
                    <div class="text-caption">Étudiants</div>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  to="/export"
                  color="info"
                  variant="outlined"
                  size="large"
                  block
                  class="pa-4"
                  prepend-icon="mdi-download"
                >
                  <div class="text-center">
                    <div class="font-weight-bold">Exporter</div>
                    <div class="text-caption">Données</div>
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar pour les notifications -->
    <v-snackbar
      v-model="notification.show"
      :color="notification.color"
      timeout="5000"
      location="top right"
    >
      {{ notification.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="notification.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// État de la page
const loading = ref(true);

// Données utilisateur
const currentUser = ref(null);

// Données statistiques
const stats = ref({
  students: 0,
  forms: 0,
  evaluations: 0,
  promotions: 0,
  groups: 0,
  subGroups: 0
});

// Statistiques utilisateurs (admin uniquement)
const userStats = ref(null);

// Données détaillées
const formStats = ref({});
const formsByType = ref([]);
const studentsByPromotion = ref([]);
const evaluationTrends = ref([]);
const topProfessors = ref([]);

// Notifications
const notification = ref({
  show: false,
  text: '',
  color: 'success'
});

// Computed properties
const isAdmin = computed(() => currentUser.value?.role === 'admin');

// Méthodes utilitaires
const showNotification = (text, color = 'success') => {
  notification.value = { show: true, text, color };
};

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrateur',
    professor: 'Professeur'
  };
  return labels[role] || 'Utilisateur';
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getProgressValue = (type) => {
  const max = Math.max(stats.value.students, stats.value.forms, stats.value.evaluations, stats.value.promotions);
  if (max === 0) return 0;
  return (stats.value[type] / max) * 100;
};

const getMonthName = (month) => {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  return months[month - 1] || '';
};

const getTrophyColor = (index) => {
  const colors = ['amber', 'grey', 'orange', 'blue', 'green'];
  return colors[index] || 'grey';
};

const getAssociationTypeLabel = (type) => {
  const labels = {
    student: 'Individuel',
    group: 'Groupe',
    subgroup: 'Sous-groupe',
    promotion: 'Promotion'
  };
  return labels[type] || type;
};

const getTypeColor = (type) => {
  const colors = {
    student: 'primary',
    group: 'success',
    subgroup: 'info',
    promotion: 'warning'
  };
  return colors[type] || 'grey';
};

// Fonctions de chargement des données
const loadCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token manquant');
    }

    // Décoder le token pour obtenir les informations utilisateur
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUser.value = {
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role
    };
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur:', error);
    showNotification('Erreur lors du chargement des informations utilisateur', 'error');
  }
};

const loadOverviewStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/stats/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      stats.value = {
        students: data.students || 0,
        forms: data.forms || 0,
        evaluations: data.evaluations || 0,
        promotions: data.promotions || 0,
        groups: data.groups || 0,
        subGroups: data.subGroups || 0
      };

      // Charger les stats utilisateurs si admin
      if (data.users && isAdmin.value) {
        userStats.value = data.users;
      }
    } else {
      throw new Error('Erreur de récupération des statistiques');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    showNotification('Erreur lors du chargement des statistiques générales', 'error');
  }
};

const loadFormsStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/stats/forms', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      formStats.value = {
        active: data.active || 0,
        inactive: data.inactive || 0
      };
      formsByType.value = data.byAssociationType || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques des formulaires:', error);
  }
};

const loadStudentsStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/stats/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      studentsByPromotion.value = data.byPromotion || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques des étudiants:', error);
  }
};

const loadEvaluationsStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/stats/evaluations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      evaluationTrends.value = data.byMonth || [];
      topProfessors.value = data.topProfessors || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques des évaluations:', error);
  }
};

const loadUserStats = async () => {
  if (!isAdmin.value) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/stats/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      userStats.value = {
        total: data.total || 0,
        professors: data.professors || 0,
        admins: data.admins || 0
      };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques utilisateurs:', error);
  }
};

// Chargement des données au montage
onMounted(async () => {
  try {
    loading.value = true;
    
    // Charger l'utilisateur en premier pour déterminer ses permissions
    await loadCurrentUser();
    
    // Charger toutes les statistiques en parallèle
    await Promise.all([
      loadOverviewStats(),
      loadFormsStats(),
      loadStudentsStats(),
      loadEvaluationsStats(),
      loadUserStats()
    ]);

    showNotification('Tableau de bord chargé avec succès !', 'success');
  } catch (error) {
    console.error('Erreur globale lors du chargement:', error);
    showNotification('Erreur lors du chargement du tableau de bord', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
}

.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.text-orange {
  color: #ff9800 !important;
}

.text-success {
  color: rgb(var(--v-theme-success)) !important;
}

.text-info {
  color: rgb(var(--v-theme-info)) !important;
}

.text-purple {
  color: #9c27b0 !important;
}

.text-teal {
  color: #009688 !important;
}

.text-red {
  color: #f44336 !important;
}

.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.elevation-2 {
  box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12) !important;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 8px !important;
  }
}
</style>
