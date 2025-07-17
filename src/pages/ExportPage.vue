<template>
  <v-container fluid class="pa-4">
    <!-- En-tête -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="success" class="mr-3">
                mdi-download-outline
              </v-icon>
              Export des données
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Exportez vos évaluations et données en format CSV
            </p>
          </div>
          <v-chip
            :color="evaluations.length > 0 ? 'success' : 'warning'"
            size="large"
            variant="flat"
            prepend-icon="mdi-database"
          >
            {{ evaluations.length }} évaluation{{ evaluations.length > 1 ? 's' : '' }} disponible{{ evaluations.length > 1 ? 's' : '' }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Configuration d'export -->
      <v-col cols="12" lg="4">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="primary" class="mr-3">mdi-cog</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Configuration</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Personnalisez votre export</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="exportForm">
              <!-- Type d'export -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-medium mb-3">Type d'export</h4>
                <v-radio-group v-model="exportConfig.type" inline>
                  <v-radio
                    label="Évaluations complètes"
                    value="full"
                    color="primary"
                  />
                  <v-radio
                    label="Résumé seulement"
                    value="summary"
                    color="success"
                  />
                </v-radio-group>
              </div>

              <!-- Filtres -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-medium mb-3">Filtres</h4>
                
                <v-select
                  v-model="exportConfig.selectedForms"
                  :items="formOptions"
                  label="Formulaires"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-clipboard-text"
                  hint="Laissez vide pour tous les formulaires"
                  persistent-hint
                  class="mb-4"
                />

                <v-select
                  v-model="exportConfig.selectedPromotions"
                  :items="promotionOptions"
                  label="Promotions"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-school"
                  hint="Laissez vide pour toutes les promotions"
                  persistent-hint
                  class="mb-4"
                />

                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="exportConfig.dateFrom"
                    type="date"
                    label="Date de début"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                    hide-details
                  />
                  <v-text-field
                    v-model="exportConfig.dateTo"
                    type="date"
                    label="Date de fin"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                    hide-details
                  />
                </div>
              </div>

              <!-- Options d'export -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-medium mb-3">Options</h4>
                <v-checkbox
                  v-model="exportConfig.includeStudentDetails"
                  label="Inclure les détails étudiants"
                  density="compact"
                  hide-details
                  class="mb-2"
                />
                <v-checkbox
                  v-model="exportConfig.includeScoreDetails"
                  label="Inclure les scores détaillés"
                  density="compact"
                  hide-details
                  class="mb-2"
                />
                <v-checkbox
                  v-model="exportConfig.includeFormDetails"
                  label="Inclure les détails du formulaire"
                  density="compact"
                  hide-details
                  class="mb-2"
                />
                <v-checkbox
                  v-model="exportConfig.includeProfessorInfo"
                  label="Inclure les informations professeur"
                  density="compact"
                  hide-details
                />
              </div>

              <!-- Format de fichier -->
              <div class="mb-4">
                <h4 class="text-subtitle-1 font-weight-medium mb-3">Format</h4>
                <v-select
                  v-model="exportConfig.format"
                  :items="formatOptions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-file-document"
                  hide-details
                />
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Aperçu et export -->
      <v-col cols="12" lg="8">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <v-icon size="large" color="info" class="mr-3">mdi-eye</v-icon>
                <div>
                  <h3 class="text-h6 font-weight-bold">Aperçu des données</h3>
                  <p class="text-subtitle-2 text-medium-emphasis mb-0">{{ filteredEvaluations.length }} évaluation{{ filteredEvaluations.length > 1 ? 's' : '' }} sélectionnée{{ filteredEvaluations.length > 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  @click="loadEvaluations"
                  :loading="loading"
                >
                  Actualiser
                </v-btn>
                <v-btn
                  color="success"
                  variant="elevated"
                  prepend-icon="mdi-download"
                  @click="exportData"
                  :disabled="filteredEvaluations.length === 0"
                  :loading="exporting"
                  size="large"
                >
                  Télécharger
                </v-btn>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <!-- Indicateur de chargement -->
            <div v-if="loading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" size="48" />
              <div class="text-h6 mt-4">Chargement des évaluations...</div>
            </div>

            <!-- Tableau d'aperçu -->
            <div v-else-if="filteredEvaluations.length > 0">
              <v-data-table
                :headers="previewHeaders"
                :items="filteredEvaluations.slice(0, 10)"
                :items-per-page="10"
                class="elevation-0"
                hide-default-footer
                density="comfortable"
              >
                <!-- Formulaire -->
                <template v-slot:item.form="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="24" class="mr-2">
                      <v-icon size="12" color="white">mdi-clipboard-text</v-icon>
                    </v-avatar>
                    <span class="text-body-2">{{ item.form?.title || 'N/A' }}</span>
                  </div>
                </template>

                <!-- Cible -->
                <template v-slot:item.target="{ item }">
                  <div v-if="item.student">
                    <v-chip size="small" color="green" variant="flat">
                      {{ item.student.firstName }} {{ item.student.lastName }}
                    </v-chip>
                  </div>
                  <div v-else-if="item.group">
                    <v-chip size="small" color="blue" variant="flat">
                      {{ item.group.name }}
                    </v-chip>
                  </div>
                  <div v-else>
                    <span class="text-caption text-medium-emphasis">N/A</span>
                  </div>
                </template>

                <!-- Scores -->
                <template v-slot:item.scores="{ item }">
                  <div class="d-flex align-center">
                    <v-progress-circular
                      :model-value="getScoreProgress(item)"
                      :color="getScoreColor(item)"
                      size="24"
                      width="3"
                      class="mr-2"
                    />
                    <span class="text-body-2">{{ item.scores?.length || 0 }} critères</span>
                  </div>
                </template>

                <!-- Date -->
                <template v-slot:item.createdAt="{ item }">
                  <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
                </template>
              </v-data-table>
              
              <v-divider />
              <div class="pa-4 text-center text-medium-emphasis">
                <v-icon class="mr-2">mdi-information</v-icon>
                Aperçu limité aux 10 premières évaluations. L'export complet inclura toutes les données filtrées.
              </div>
            </div>

            <!-- Aucune donnée -->
            <div v-else class="text-center pa-12">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-off</v-icon>
              <h3 class="text-h6 mb-2">Aucune évaluation trouvée</h3>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Aucune évaluation ne correspond aux critères sélectionnés
              </p>
              <v-btn color="primary" variant="outlined" @click="resetFilters">
                Réinitialiser les filtres
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Statistiques d'export -->
        <v-card v-if="filteredEvaluations.length > 0" class="rounded-lg elevation-2 mt-4">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-around text-center">
              <div>
                <div class="text-h6 font-weight-bold text-primary">{{ filteredEvaluations.length }}</div>
                <div class="text-caption text-medium-emphasis">Évaluations</div>
              </div>
              <v-divider vertical />
              <div>
                <div class="text-h6 font-weight-bold text-success">{{ uniqueStudentsCount }}</div>
                <div class="text-caption text-medium-emphasis">Étudiants uniques</div>
              </div>
              <v-divider vertical />
              <div>
                <div class="text-h6 font-weight-bold text-info">{{ uniqueFormsCount }}</div>
                <div class="text-caption text-medium-emphasis">Formulaires uniques</div>
              </div>
              <v-divider vertical />
              <div>
                <div class="text-h6 font-weight-bold text-warning">{{ estimatedFileSize }}</div>
                <div class="text-caption text-medium-emphasis">Taille estimée</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar pour notifications -->
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
import { ref, onMounted, computed, watch } from 'vue';

// État de la page
const loading = ref(false);
const exporting = ref(false);
const evaluations = ref([]);
const forms = ref([]);
const promotions = ref([]);

// Configuration d'export
const exportConfig = ref({
  type: 'full',
  selectedForms: [],
  selectedPromotions: [],
  dateFrom: '',
  dateTo: '',
  includeStudentDetails: true,
  includeScoreDetails: true,
  includeFormDetails: false,
  includeProfessorInfo: false,
  format: 'csv'
});

// Notifications
const notification = ref({
  show: false,
  text: '',
  color: 'success'
});

// Options pour les sélecteurs
const formatOptions = [
  { title: 'CSV (Comma Separated Values)', value: 'csv' },
  { title: 'Excel (.xlsx)', value: 'xlsx' }
];

const formOptions = computed(() => {
  return forms.value.map(form => ({
    title: form.title,
    value: form._id
  }));
});

const promotionOptions = computed(() => {
  return promotions.value.map(promotion => ({
    title: `${promotion.name} ${promotion.year}`,
    value: promotion._id
  }));
});

// En-têtes du tableau d'aperçu
const previewHeaders = [
  { title: 'Formulaire', key: 'form', align: 'start' },
  { title: 'Cible', key: 'target', align: 'start' },
  { title: 'Scores', key: 'scores', align: 'center' },
  { title: 'Date', key: 'createdAt', align: 'start' }
];

// Évaluations filtrées
const filteredEvaluations = computed(() => {
  let filtered = [...evaluations.value];

  // Filtrer par formulaires
  if (exportConfig.value.selectedForms.length > 0) {
    filtered = filtered.filter(evaluation => 
      exportConfig.value.selectedForms.includes(evaluation.form?._id)
    );
  }

  // Filtrer par promotions
  if (exportConfig.value.selectedPromotions.length > 0) {
    filtered = filtered.filter(evaluation => 
      exportConfig.value.selectedPromotions.includes(evaluation.promotion?._id)
    );
  }

  // Filtrer par dates
  if (exportConfig.value.dateFrom) {
    const fromDate = new Date(exportConfig.value.dateFrom);
    filtered = filtered.filter(evaluation => 
      new Date(evaluation.createdAt) >= fromDate
    );
  }

  if (exportConfig.value.dateTo) {
    const toDate = new Date(exportConfig.value.dateTo);
    toDate.setHours(23, 59, 59, 999); // Fin de journée
    filtered = filtered.filter(evaluation => 
      new Date(evaluation.createdAt) <= toDate
    );
  }

  return filtered;
});

// Statistiques
const uniqueStudentsCount = computed(() => {
  const studentIds = new Set();
  filteredEvaluations.value.forEach(evaluation => {
    if (evaluation.student?._id) {
      studentIds.add(evaluation.student._id);
    }
  });
  return studentIds.size;
});

const uniqueFormsCount = computed(() => {
  const formIds = new Set();
  filteredEvaluations.value.forEach(evaluation => {
    if (evaluation.form?._id) {
      formIds.add(evaluation.form._id);
    }
  });
  return formIds.size;
});

const estimatedFileSize = computed(() => {
  const baseSize = filteredEvaluations.value.length * 0.5; // Base KB par évaluation
  let multiplier = 1;
  
  if (exportConfig.value.includeStudentDetails) multiplier += 0.3;
  if (exportConfig.value.includeScoreDetails) multiplier += 0.5;
  if (exportConfig.value.includeFormDetails) multiplier += 0.2;
  if (exportConfig.value.includeProfessorInfo) multiplier += 0.1;
  
  const sizeKB = baseSize * multiplier;
  
  if (sizeKB < 1024) {
    return `${Math.round(sizeKB)} KB`;
  } else {
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  }
});

// Méthodes utilitaires
const showNotification = (text, color = 'success') => {
  notification.value = { show: true, text, color };
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getScoreProgress = (evaluation) => {
  if (!evaluation.scores || evaluation.scores.length === 0) return 0;
  
  const totalCriteria = evaluation.form?.sections?.reduce((total, section) => 
    total + (section.lines?.length || 0), 0) || 1;
  
  return (evaluation.scores.length / totalCriteria) * 100;
};

const getScoreColor = (evaluation) => {
  const progress = getScoreProgress(evaluation);
  if (progress >= 80) return 'success';
  if (progress >= 50) return 'warning';
  return 'error';
};

const resetFilters = () => {
  exportConfig.value = {
    type: 'full',
    selectedForms: [],
    selectedPromotions: [],
    dateFrom: '',
    dateTo: '',
    includeStudentDetails: true,
    includeScoreDetails: true,
    includeFormDetails: false,
    includeProfessorInfo: false,
    format: 'csv'
  };
};

// Fonctions de chargement des données
const loadEvaluations = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/evaluations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      evaluations.value = data.evaluations || data || [];
      showNotification(`${evaluations.value.length} évaluations chargées`, 'success');
    } else {
      throw new Error('Erreur lors du chargement des évaluations');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur lors du chargement des évaluations', 'error');
  } finally {
    loading.value = false;
  }
};

const loadForms = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/forms', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      forms.value = data.forms || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formulaires:', error);
  }
};

const loadPromotions = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/promotions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      promotions.value = data.promotions || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error);
  }
};

// Fonction d'export
const exportData = async () => {
  if (filteredEvaluations.value.length === 0) {
    showNotification('Aucune donnée à exporter', 'warning');
    return;
  }

  exporting.value = true;
  try {
    let csvContent = '';
    const data = filteredEvaluations.value;

    // Générer les en-têtes selon la configuration
    const headers = ['ID Évaluation', 'Date de création'];
    
    // Formulaire
    headers.push('Formulaire');
    if (exportConfig.value.includeFormDetails) {
      headers.push('Type formulaire', 'Date validité début', 'Date validité fin');
    }

    // Cible (étudiant/groupe)
    headers.push('Type cible', 'Nom cible');
    if (exportConfig.value.includeStudentDetails) {
      headers.push('Numéro étudiant', 'Email étudiant', 'Promotion', 'Groupe');
    }

    // Professeur
    if (exportConfig.value.includeProfessorInfo) {
      headers.push('Professeur prénom', 'Professeur nom', 'Email professeur');
    }

    // Scores
    if (exportConfig.value.includeScoreDetails) {
      headers.push('Nombre critères évalués', 'Score total', 'Score moyen');
    } else {
      headers.push('Statut évaluation');
    }

    csvContent += headers.join(';') + '\n';

    // Générer les lignes de données
    data.forEach(evaluation => {
      const row = [];
      
      // Données de base
      row.push(evaluation._id || '');
      row.push(formatDate(evaluation.createdAt));
      
      // Formulaire
      row.push(evaluation.form?.title || 'N/A');
      if (exportConfig.value.includeFormDetails) {
        row.push(evaluation.form?.associationType || '');
        row.push(formatDate(evaluation.form?.validFrom));
        row.push(formatDate(evaluation.form?.validTo));
      }

      // Cible
      if (evaluation.student) {
        row.push('Étudiant');
        row.push(`${evaluation.student.firstName} ${evaluation.student.lastName}`);
        if (exportConfig.value.includeStudentDetails) {
          row.push(evaluation.student.studentNumber || '');
          row.push(evaluation.student.email || '');
          row.push(evaluation.promotion?.name || '');
          row.push(evaluation.group?.name || '');
        }
      } else if (evaluation.group) {
        row.push('Groupe');
        row.push(evaluation.group.name || '');
        if (exportConfig.value.includeStudentDetails) {
          row.push('', '', evaluation.promotion?.name || '', evaluation.group.name || '');
        }
      } else {
        row.push('N/A', 'N/A');
        if (exportConfig.value.includeStudentDetails) {
          row.push('', '', '', '');
        }
      }

      // Professeur
      if (exportConfig.value.includeProfessorInfo) {
        row.push(evaluation.professor?.firstName || '');
        row.push(evaluation.professor?.lastName || '');
        row.push(evaluation.professor?.email || '');
      }

      // Scores
      if (exportConfig.value.includeScoreDetails) {
        const scoresCount = evaluation.scores?.length || 0;
        const totalScore = evaluation.scores?.reduce((sum, score) => {
          if (score.commonScore !== undefined) return sum + score.commonScore;
          if (score.individualScores?.length > 0) {
            return sum + score.individualScores.reduce((subSum, indScore) => subSum + indScore.score, 0);
          }
          return sum;
        }, 0) || 0;
        const avgScore = scoresCount > 0 ? (totalScore / scoresCount).toFixed(2) : '0';
        
        row.push(scoresCount.toString());
        row.push(totalScore.toString());
        row.push(avgScore);
      } else {
        const status = (evaluation.scores?.length || 0) > 0 ? 'Complétée' : 'En cours';
        row.push(status);
      }

      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';') + '\n';
    });

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `evaluations_export_${timestamp}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification(`Export réussi ! ${data.length} évaluations exportées`, 'success');
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    showNotification('Erreur lors de l\'export des données', 'error');
  } finally {
    exporting.value = false;
  }
};

// Chargement initial
onMounted(async () => {
  await Promise.all([
    loadEvaluations(),
    loadForms(),
    loadPromotions()
  ]);
});

// Watchers pour actualiser l'aperçu
watch(() => exportConfig.value, () => {
  // L'aperçu se met à jour automatiquement grâce au computed
}, { deep: true });
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.v-data-table {
  border-radius: 0;
}

.v-progress-circular {
  display: inline-flex;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.text-success {
  color: rgb(var(--v-theme-success)) !important;
}

.text-info {
  color: rgb(var(--v-theme-info)) !important;
}

.text-warning {
  color: rgb(var(--v-theme-warning)) !important;
}

.elevation-3 {
  box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12) !important;
}

@media (max-width: 1024px) {
  .v-container {
    padding: 8px !important;
  }
}

@media (max-width: 768px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }
  
  .d-flex.gap-2 {
    width: 100%;
  }
  
  .d-flex.gap-2 .v-btn {
    flex: 1;
  }
}
</style>
