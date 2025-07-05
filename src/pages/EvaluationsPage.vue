<template>
  <v-container fluid>
    <!-- En-tête de la page -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <h2 class="text-h4">Évaluations</h2>
          <div class="d-flex gap-2">
            <v-btn 
              color="success" 
              variant="outlined"
              prepend-icon="mdi-download" 
              @click="exportAllEvaluationsCSV"
              :disabled="filteredEvaluations.length === 0"
            >
              Exporter tout (CSV)
            </v-btn>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewEvaluationDialog">
              Nouvelle évaluation
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Section des évaluations existantes -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-list</v-icon>
            Mes évaluations
          </v-card-title>
          <v-card-text>
            <!-- Filtres -->
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="searchEvaluations"
                  label="Rechercher une évaluation"
                  prepend-inner-icon="mdi-magnify"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterEvaluations"
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="filterFormId"
                  :items="formOptions"
                  label="Filtrer par formulaire"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  clearable
                  @update:model-value="filterEvaluations"
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="filterStatus"
                  :items="[
                    { title: 'Toutes', value: '' },
                    { title: 'En cours', value: 'draft' },
                    { title: 'Terminées', value: 'completed' }
                  ]"
                  label="Statut"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @update:model-value="filterEvaluations"
                />
              </v-col>
            </v-row>

            <!-- Table des évaluations -->
            <v-data-table
              :headers="evaluationHeaders"
              :items="filteredEvaluations"
              :items-per-page="10"
              class="elevation-1 rounded-lg"
              :loading="loadingEvaluations"
            >
              <template v-slot:item.formTitle="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.formTitle }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.formId }}</div>
                </div>
              </template>

              <template v-slot:item.evaluatedEntity="{ item }">
                <v-chip
                  :color="item.studentId ? 'primary' : 'secondary'"
                  size="small"
                >
                  {{ item.studentId ? `${item.studentName}` : `Groupe ${item.groupNumber}` }}
                </v-chip>
              </template>

              <template v-slot:item.progress="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.progress"
                    :color="item.progress === 100 ? 'success' : 'primary'"
                    height="6"
                    rounded
                    class="mr-2"
                    style="min-width: 60px;"
                  />
                  <span class="text-caption">{{ item.progress }}%</span>
                </div>
              </template>

              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>

              <template v-slot:item.updatedAt="{ item }">
                <div>
                  {{ formatDate(item.updatedAt) }}
                  <div v-if="item.updatedAt !== item.createdAt" class="text-caption text-medium-emphasis">
                    (modifiée)
                  </div>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  color="primary"
                  @click="editEvaluation(item)"
                  size="small"
                >
                  <v-icon>{{ item.progress === 100 ? 'mdi-eye' : 'mdi-pencil' }}</v-icon>
                  <v-tooltip activator="parent" location="top">
                    {{ item.progress === 100 ? 'Voir' : 'Continuer' }}
                  </v-tooltip>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  color="success"
                  @click="exportEvaluationCSV(item)"
                  size="small"
                  :disabled="item.progress === 0"
                >
                  <v-icon>mdi-download</v-icon>
                  <v-tooltip activator="parent" location="top">
                    {{ item.progress === 0 ? 'Aucune donnée à exporter' : 'Exporter CSV' }}
                  </v-tooltip>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  @click="confirmDeleteEvaluation(item)"
                  size="small"
                >
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top">Supprimer</v-tooltip>
                </v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-remove</v-icon>
                  <div class="text-h6">Aucune évaluation</div>
                  <div class="text-body-2 text-medium-emphasis">
                    Commencez par créer une nouvelle évaluation
                  </div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de sélection de formulaire pour nouvelle évaluation -->
    <v-dialog v-model="selectFormDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 primary text-white pa-4">
          <v-icon left color="white">mdi-clipboard-plus</v-icon>
          Sélectionner un formulaire
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-text-field
            v-model="searchForms"
            label="Rechercher un formulaire"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            class="mb-4"
          />
          
          <div v-if="loadingForms" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary" />
            <div class="mt-2">Chargement des formulaires...</div>
          </div>
          
          <v-list v-else-if="filteredValidForms.length > 0" class="rounded">
            <v-list-item
              v-for="form in filteredValidForms"
              :key="form._id"
              @click="selectForm(form)"
              class="mb-2"
              variant="outlined"
            >
              <v-list-item-title class="font-weight-medium">
                {{ form.title }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ form.associationType === 'student' ? 'Étudiants individuels' : 'Groupes' }} •
                Valide jusqu'au {{ formatDate(form.validTo) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="small" color="success">
                  Valide
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else class="text-center pa-4">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-remove</v-icon>
            <div class="text-h6">Aucun formulaire valide</div>
            <div class="text-body-2 text-medium-emphasis">
              Aucun formulaire n'est disponible pour évaluation actuellement
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="selectFormDialog = false">
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'évaluation -->
    <v-dialog v-model="evaluationDialog" max-width="900px" persistent>
      <v-card v-if="selectedForm">
        <v-card-title class="text-h5 primary text-white pa-4">
          <v-icon left color="white">mdi-clipboard-edit</v-icon>
          {{ currentEvaluation.id ? 'Modifier' : 'Nouvelle' }} évaluation
        </v-card-title>
        
        <v-card-text class="pa-6">
          <!-- Informations du formulaire -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">📋 {{ selectedForm.title }}</h3>
            
            <!-- Sélection de l'entité à évaluer -->
            <v-select
              v-model="currentEvaluation.selectedEntity"
              :items="evaluationTargets"
              :label="selectedForm.associationType === 'student' ? 'Sélectionner un étudiant' : 'Sélectionner un groupe'"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              :rules="[rules.required]"
              return-object
            />
          </div>

          <!-- Sections d'évaluation -->
          <div v-if="currentEvaluation.selectedEntity">
            <h3 class="text-h6 mb-4">📝 Critères d'évaluation</h3>
            
            <v-expansion-panels v-model="expandedSections" multiple>
              <v-expansion-panel
                v-for="(section, sectionIndex) in selectedForm.sections"
                :key="sectionIndex"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center w-100">
                    <v-icon class="mr-2">mdi-folder-outline</v-icon>
                    <span class="font-weight-medium">{{ section.title }}</span>
                    <v-spacer />
                    <v-chip size="small" class="mr-2">
                      {{ getCompletedCriteria(sectionIndex) }}/{{ section.lines.length }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                
                <v-expansion-panel-text>
                  <v-card flat>
                    <v-card-text>
                      <v-row>
                        <v-col
                          v-for="(line, lineIndex) in section.lines"
                          :key="lineIndex"
                          cols="12"
                          md="6"
                        >
                          <v-card variant="outlined" class="pa-4">
                            <div class="text-subtitle-2 mb-3">{{ line.title }}</div>
                            
                            <!-- Notation binaire (Oui/Non) -->
                            <div v-if="line.type === 'binary'">
                              <v-radio-group
                                v-model="currentEvaluation.scores[`${sectionIndex}-${lineIndex}`]"
                                inline
                                hide-details
                              >
                                <v-radio label="Non" :value="0" color="error" />
                                <v-radio label="Oui" :value="1" color="success" />
                              </v-radio-group>
                            </div>
                            
                            <!-- Notation par échelle (0-8) -->
                            <div v-else-if="line.type === 'scale'">
                              <v-slider
                                v-model="currentEvaluation.scores[`${sectionIndex}-${lineIndex}`]"
                                :min="0"
                                :max="8"
                                :step="1"
                                show-ticks="always"
                                tick-size="4"
                                thumb-label
                                color="primary"
                              >
                                <template v-slot:thumb-label="{ modelValue }">
                                  {{ modelValue }}/8
                                </template>
                              </v-slider>
                              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                                <span>0 - Insuffisant</span>
                                <span>4 - Satisfaisant</span>
                                <span>8 - Excellent</span>
                              </div>
                            </div>
                            
                            <div class="mt-2 text-caption text-medium-emphasis">
                              Score max: {{ line.maxScore }}
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <!-- Résumé des scores -->
          <div v-if="currentEvaluation.selectedEntity && Object.keys(currentEvaluation.scores).length > 0" class="mt-6">
            <v-card variant="tonal" color="info">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-2">mdi-chart-line</v-icon>
                  <span class="font-weight-medium">Progression de l'évaluation</span>
                </div>
                <v-progress-linear
                  :model-value="evaluationProgress"
                  :color="evaluationProgress === 100 ? 'success' : 'info'"
                  height="8"
                  rounded
                />
                <div class="mt-2 text-body-2">
                  {{ Object.keys(currentEvaluation.scores).length }} critères sur {{ totalCriteria }} évalués ({{ evaluationProgress }}%)
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>

        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="closeEvaluationDialog">
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            @click="saveEvaluation"
            :loading="savingEvaluation"
            :disabled="!canSaveEvaluation"
          >
            {{ currentEvaluation.id ? 'Modifier' : 'Sauvegarder' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false">
            Annuler
          </v-btn>
          <v-btn color="error" @click="deleteEvaluation">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar pour les notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { authService } from '../services/api.js';

// État principal
const evaluations = ref([]);
const filteredEvaluations = ref([]);
const validForms = ref([]);
const allForms = ref([]); // Nouveau: stocke tous les formulaires
const allStudents = ref([]);
const loadingEvaluations = ref(false);
const loadingForms = ref(false);
const savingEvaluation = ref(false);

// État des dialogs
const selectFormDialog = ref(false);
const evaluationDialog = ref(false);
const deleteDialog = ref(false);

// État des filtres et recherche
const searchEvaluations = ref('');
const searchForms = ref('');
const filterFormId = ref('');
const filterStatus = ref('');

// État de l'évaluation en cours
const selectedForm = ref(null);
const currentEvaluation = ref({
  id: null,
  formId: null,
  selectedEntity: null,
  scores: {},
  createdAt: null,
  updatedAt: null
});

const expandedSections = ref([]);
const evaluationToDelete = ref(null);

// État des notifications
const snackbar = ref({ show: false, text: '', color: 'success' });

// Headers pour la table des évaluations
const evaluationHeaders = [
  { title: 'Formulaire', key: 'formTitle', sortable: true },
  { title: 'Entité évaluée', key: 'evaluatedEntity', sortable: false },
  { title: 'Progression', key: 'progress', sortable: true, width: '120px' },
  { title: 'Créée le', key: 'createdAt', sortable: true, width: '110px' },
  { title: 'Modifiée le', key: 'updatedAt', sortable: true, width: '110px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '140px' }
];

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis'
};

// Computed properties
const currentUser = computed(() => authService.getCurrentUser());

const formOptions = computed(() => {
  const options = [{ title: 'Tous les formulaires', value: '' }];
  const uniqueForms = [...new Set(evaluations.value.map(e => e.formId))];
  uniqueForms.forEach(formId => {
    const form = validForms.value.find(f => f._id === formId);
    if (form) {
      options.push({ title: form.title, value: formId });
    }
  });
  return options;
});

const filteredValidForms = computed(() => {
  if (!searchForms.value) return validForms.value;
  return validForms.value.filter(form =>
    form.title.toLowerCase().includes(searchForms.value.toLowerCase())
  );
});

const evaluationTargets = computed(() => {
  if (!selectedForm.value) return [];
  
  if (selectedForm.value.associationType === 'student') {
    return selectedForm.value.students.map(studentId => {
      const student = allStudents.value.find(s => s._id === studentId);
      return student ? {
        title: `${student.firstName} ${student.lastName}`,
        value: studentId,
        type: 'student',
        studentId: studentId,
        groupNumber: null
      } : null;
    }).filter(Boolean);
  } else {
    const groups = [];
    for (let i = 1; i <= selectedForm.value.groupCount; i++) {
      groups.push({
        title: `Groupe ${i}`,
        value: `group-${i}`,
        type: 'group',
        studentId: null,
        groupNumber: i
      });
    }
    return groups;
  }
});

const totalCriteria = computed(() => {
  if (!selectedForm.value) return 0;
  return selectedForm.value.sections.reduce((total, section) => 
    total + section.lines.length, 0
  );
});

const evaluationProgress = computed(() => {
  if (totalCriteria.value === 0) return 0;
  const scored = Object.keys(currentEvaluation.value.scores).length;
  return Math.round((scored / totalCriteria.value) * 100);
});

const canSaveEvaluation = computed(() => {
  // Vérifier qu'une entité est sélectionnée
  if (!currentEvaluation.value.selectedEntity) return false;
  
  // Vérifier qu'au moins un critère a été évalué
  if (Object.keys(currentEvaluation.value.scores).length === 0) return false;
  
  // Vérifier qu'un formulaire est sélectionné
  if (!selectedForm.value) return false;
  
  // Vérifier que le formulaire est toujours valide (non archivé, non supprimé)
  if (selectedForm.value.isArchived || selectedForm.value.isDeleted) return false;
  
  // Vérifier que tous les scores sont valides (entre 0 et le score maximum)
  const isAllScoresValid = Object.entries(currentEvaluation.value.scores).every(([key, score]) => {
    const [sectionIndex, lineIndex] = key.split('-').map(Number);
    const line = selectedForm.value.sections[sectionIndex]?.lines[lineIndex];
    if (!line) return false;
    
    const maxScore = line.maxScore || 20;
    return score >= 0 && score <= maxScore && !isNaN(score);
  });
  
  return isAllScoresValid;
});

// Méthodes utilitaires
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, text: message, color };
};

const getCompletedCriteria = (sectionIndex) => {
  if (!selectedForm.value) return 0;
  const section = selectedForm.value.sections[sectionIndex];
  if (!section) return 0;
  
  let completed = 0;
  section.lines.forEach((line, lineIndex) => {
    const scoreKey = `${sectionIndex}-${lineIndex}`;
    if (currentEvaluation.value.scores.hasOwnProperty(scoreKey)) {
      completed++;
    }
  });
  return completed;
};

// Gestion des données
const fetchValidForms = async () => {
  loadingForms.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/forms/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('Erreur lors du chargement des formulaires');
    }
    
    const forms = await response.json();
    const now = new Date();
    
    // Stocker tous les formulaires
    allForms.value = forms;
    
    // Filtrer les formulaires valides (date actuelle dans la plage de validité)
    validForms.value = forms.filter(form => {
      const validFrom = new Date(form.validFrom);
      const validTo = new Date(form.validTo);
      return now >= validFrom && now <= validTo;
    });
    
    console.log('Formulaires valides chargés:', validForms.value.length);
    console.log('Tous les formulaires chargés:', allForms.value.length);
    
  } catch (error) {
    console.error('Erreur lors du chargement des formulaires:', error);
    showNotification('Erreur lors du chargement des formulaires', 'error');
    validForms.value = [];
    allForms.value = [];
  } finally {
    loadingForms.value = false;
  }
};

const fetchStudents = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/students/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
    
    const data = await response.json();
    allStudents.value = data || [];
    
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
    allStudents.value = [];
  }
};

const fetchEvaluations = async () => {
  loadingEvaluations.value = true;
  try {
    const user = authService.getCurrentUser();
    const response = await fetch(`http://localhost:5000/api/evaluations/professor/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('Erreur lors du chargement des évaluations');
    }
    
    const data = await response.json();
    
    // Récupérer tous les formulaires (pas seulement les valides) pour enrichir les évaluations
    let allForms = [];
    try {
      const formsResponse = await fetch('http://localhost:5000/api/forms/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (formsResponse.ok) {
        allForms = await formsResponse.json();
      } else {
        console.error('Erreur HTTP lors de la récupération des formulaires:', formsResponse.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires pour enrichir les évaluations:', error);
    }
    
    // Enrichir les évaluations avec les données des formulaires et étudiants
    evaluations.value = data.map(evaluation => {
      // S'assurer qu'on utilise bien l'ID du formulaire et non l'ID de l'évaluation
      let formId;
      if (evaluation.form) {
        // Si evaluation.form est un objet, extraire l'_id
        if (typeof evaluation.form === 'object' && evaluation.form._id) {
          formId = evaluation.form._id;
        } else {
          formId = evaluation.form;
        }
      } else {
        formId = evaluation.formId;
      }

      const form = allForms.find(f => f._id.toString() === formId?.toString());
      if (!form) {
        console.warn('Formulaire non trouvé pour l\'ID:', formId);
      }

      // Déterminer l'entité évaluée (étudiant ou groupe)
      let entityName = null;
      if (evaluation.student) {
        const student = allStudents.value.find(s => s._id === evaluation.student);
        entityName = student ? `${student.firstName} ${student.lastName}` : 'Étudiant introuvable';
      } else if (evaluation.groupNumber && evaluation.groupNumber > 0) {
        entityName = `Groupe ${evaluation.groupNumber}`;
      } else {
        entityName = 'Entité non définie';
      }
      
      // Calculer la progression
      const totalCriteria = form ? 
        form.sections.reduce((total, section) => total + section.lines.length, 0) : 0;
      const scoredCriteria = evaluation.scores ? evaluation.scores.length : 0;
      const progress = totalCriteria > 0 ? Math.round((scoredCriteria / totalCriteria) * 100) : 0;
      
      return {
        ...evaluation,
        formTitle: form?.title || 'Formulaire supprimé',
        formId: formId,
        studentName: entityName, // Nom générique pour l'affichage (étudiant ou groupe)
        progress: progress
      };
    });
    
    filteredEvaluations.value = evaluations.value;
    console.log('Évaluations chargées:', evaluations.value.length);
    
  } catch (error) {
    console.error('Erreur lors du chargement des évaluations:', error);
    showNotification('Erreur lors du chargement des évaluations', 'error');
    evaluations.value = [];
    filteredEvaluations.value = [];
  } finally {
    loadingEvaluations.value = false;
  }
};

const filterEvaluations = () => {
  filteredEvaluations.value = evaluations.value.filter(evaluation => {
    const matchesSearch = !searchEvaluations.value || 
      evaluation.formTitle.toLowerCase().includes(searchEvaluations.value.toLowerCase()) ||
      (evaluation.studentName && evaluation.studentName.toLowerCase().includes(searchEvaluations.value.toLowerCase()));
    
    const matchesForm = !filterFormId.value || evaluation.formId === filterFormId.value;
    
    const matchesStatus = !filterStatus.value || 
      (filterStatus.value === 'completed' && evaluation.progress === 100) ||
      (filterStatus.value === 'draft' && evaluation.progress < 100);
    
    return matchesSearch && matchesForm && matchesStatus;
  });
};

// Gestion des dialogs
const openNewEvaluationDialog = () => {
  selectFormDialog.value = true;
  fetchValidForms();
};

const selectForm = async (form) => {
  selectedForm.value = form;
  selectFormDialog.value = false;
  
  // Réinitialiser l'évaluation
  currentEvaluation.value = {
    id: null,
    formId: form._id,
    selectedEntity: null,
    scores: {},
    createdAt: null,
    updatedAt: null
  };
  
  // Ouvrir toutes les sections par défaut
  expandedSections.value = form.sections.map((_, index) => index);
  
  evaluationDialog.value = true;
};

const editEvaluation = async (evaluation) => {
  // Déterminer l'ID du formulaire (essayer les deux propriétés possibles)
  const formId = evaluation.form || evaluation.formId;
  
  // Chercher d'abord dans les formulaires valides
  let form = validForms.value.find(f => f._id === formId || f._id.toString() === formId?.toString());
  
  if (!form) {
    // Si le formulaire n'est pas dans les formulaires valides, récupérer tous les formulaires
    try {
      const response = await fetch('http://localhost:5000/api/forms/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const allForms = await response.json();
        form = allForms.find(f => f._id === formId || f._id.toString() === formId?.toString());
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du formulaire:', error);
    }
  }
  
  if (!form) {
    console.error('Formulaire non trouvé pour l\'ID:', formId);
    showNotification('Formulaire non trouvé', 'error');
    return;
  }
  
  selectedForm.value = form;
  
  // Reconstituer la structure de l'évaluation
  const scores = {};
  evaluation.scores.forEach(score => {
    // Trouver l'index de la ligne dans le formulaire
    let sectionIndex = -1;
    let lineIndex = -1;
    
    form.sections.forEach((section, sIdx) => {
      section.lines.forEach((line, lIdx) => {
        if (line._id === score.lineId) {
          sectionIndex = sIdx;
          lineIndex = lIdx;
        }
      });
    });
    
    if (sectionIndex >= 0 && lineIndex >= 0) {
      scores[`${sectionIndex}-${lineIndex}`] = score.score;
    }
  });
  
  // Trouver l'entité évaluée
  let selectedEntity = null;
  if (evaluation.student) {
    const student = allStudents.value.find(s => s._id === evaluation.student);
    if (student) {
      selectedEntity = {
        title: `${student.firstName} ${student.lastName}`,
        value: student._id,
        type: 'student',
        studentId: student._id,
        groupNumber: null
      };
    }
  } else if (evaluation.groupNumber) {
    selectedEntity = {
      title: `Groupe ${evaluation.groupNumber}`,
      value: `group-${evaluation.groupNumber}`,
      type: 'group',
      studentId: null,
      groupNumber: evaluation.groupNumber
    };
  }
  
  currentEvaluation.value = {
    id: evaluation._id,
    formId: form._id,
    selectedEntity: selectedEntity,
    scores: scores,
    createdAt: evaluation.createdAt,
    updatedAt: evaluation.updatedAt
  };
  
  expandedSections.value = form.sections.map((_, index) => index);
  evaluationDialog.value = true;
};

const closeEvaluationDialog = () => {
  evaluationDialog.value = false;
  selectedForm.value = null;
  currentEvaluation.value = {
    id: null,
    formId: null,
    selectedEntity: null,
    scores: {},
    createdAt: null,
    updatedAt: null
  };
};

const saveEvaluation = async () => {
  if (!canSaveEvaluation.value) {
    showNotification('Veuillez remplir au moins un critère avec des scores valides', 'warning');
    return;
  }
  
  // Validation supplémentaire du formulaire
  if (!selectedForm.value) {
    showNotification('Aucun formulaire sélectionné', 'error');
    return;
  }
  
  if (selectedForm.value.isArchived) {
    showNotification('Impossible de modifier une évaluation basée sur un formulaire archivé', 'error');
    return;
  }
  
  savingEvaluation.value = true;
  try {
    const user = authService.getCurrentUser();
    
    // Convertir les scores au format attendu par l'API
    const scoresArray = [];
    Object.entries(currentEvaluation.value.scores).forEach(([key, score]) => {
      const [sectionIndex, lineIndex] = key.split('-').map(Number);
      const line = selectedForm.value.sections[sectionIndex]?.lines[lineIndex];
      if (line && line._id) {
        // Validation du score
        const maxScore = line.maxScore || 20;
        if (score < 0 || score > maxScore || isNaN(score)) {
          throw new Error(`Score invalide pour le critère "${line.title}": ${score} (max: ${maxScore})`);
        }
        
        scoresArray.push({
          lineId: line._id,
          score: Number(score)
        });
      }
    });

    // Vérifier qu'on a au moins un score valide
    if (scoresArray.length === 0) {
      showNotification('Aucun score valide trouvé', 'error');
      return;
    }
    
    // Construire le payload selon le format exact attendu par le backend
    const payload = {
      formId: currentEvaluation.value.formId,
      professorId: user.id,
      studentId: currentEvaluation.value.selectedEntity?.type === 'student' 
        ? currentEvaluation.value.selectedEntity.studentId 
        : null,
      groupNumber: currentEvaluation.value.selectedEntity?.type === 'group' 
        ? currentEvaluation.value.selectedEntity.groupNumber 
        : 0,
      scores: scoresArray
    };

    console.log('Payload envoyé à l\'API:', payload);
    
    let response;
    
    // Déterminer l'endpoint selon si c'est une création ou modification
    if (currentEvaluation.value.id) {
      // Modification d'une évaluation existante
      response = await fetch(`http://localhost:5000/api/evaluations/update/${currentEvaluation.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Création d'une nouvelle évaluation
      response = await fetch('http://localhost:5000/api/evaluations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
    }

    const result = await response.json();
    console.log('Réponse de l\'API:', result);

    // Message de succès
    const action = currentEvaluation.value.id ? 'modifiée' : 'créée';
    showNotification(`Évaluation ${action} avec succès`, 'success');
    
    // Fermer le dialog et recharger les données
    closeEvaluationDialog();
    await fetchEvaluations();
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification(error.message || 'Erreur lors de la sauvegarde de l\'évaluation', 'error');
  } finally {
    savingEvaluation.value = false;
  }
};

const confirmDeleteEvaluation = (evaluation) => {
  evaluationToDelete.value = evaluation;
  deleteDialog.value = true;
};

const deleteEvaluation = async () => {
  if (!evaluationToDelete.value) return;
  
  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/delete/${evaluationToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('Erreur lors de la suppression');
    }
    
    showNotification('Évaluation supprimée avec succès !', 'success');
    deleteDialog.value = false;
    evaluationToDelete.value = null;
    
    await fetchEvaluations();
    
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
};

const exportEvaluationCSV = async (evaluation) => {
  try {
    console.log('Export CSV pour l\'évaluation:', evaluation);
    
    // Récupérer les détails complets de l'évaluation avec les scores
    const response = await fetch(`http://localhost:5000/api/evaluations/${evaluation._id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'évaluation');
    }
    
    const evaluationDetails = await response.json();
    console.log('Détails de l\'évaluation:', evaluationDetails);
    
    // Trouver le formulaire correspondant
    const form = allForms.value.find(f => {
      const formId = typeof evaluation.form === 'object' ? evaluation.form._id : evaluation.form;
      return f._id === formId;
    });
    
    if (!form) {
      throw new Error('Formulaire introuvable pour cette évaluation');
    }
    
    // Générer les données CSV
    const csvData = generateEvaluationCSV(evaluationDetails, form);
    
    // Créer et télécharger le fichier CSV
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nom du fichier amélioré avec plus d'informations
    const entityInfo = evaluation.studentName 
      ? evaluation.studentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      : `Groupe_${evaluation.groupNumber}`;
    const formTitle = form.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const status = evaluation.progress === 100 ? 'TERMINE' : 'EN_COURS';
    
    // Calculer le pourcentage pour l'inclure dans le nom
    let totalScore = 0;
    let maxScore = 0;
    if (evaluation.scores && Array.isArray(evaluation.scores)) {
      evaluation.scores.forEach(scoreItem => {
        if (scoreItem.lineId) {
          totalScore += scoreItem.score;
          // Trouver la ligne correspondante pour obtenir le score max
          form.sections.forEach(section => {
            if (section.lines) {
              section.lines.forEach(line => {
                if (line._id === scoreItem.lineId) {
                  maxScore += line.maxScore || 20;
                }
              });
            }
          });
        }
      });
    }
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    const filename = `Evaluation_${formTitle}_${entityInfo}_${percentage}pct_${status}_${date}_${time}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Export CSV réalisé avec succès', 'success');
    
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    showNotification('Erreur lors de l\'export CSV: ' + error.message, 'error');
  }
};

const generateEvaluationCSV = (evaluation, form) => {
  const csvLines = [];
  
  // Calcul préalable des scores pour les résumés
  let totalScore = 0;
  let maxPossibleScore = 0;
  let totalLines = 0;
  
  // Créer un mapping des scores par lineId
  const scoresMap = {};
  if (evaluation.scores && Array.isArray(evaluation.scores)) {
    evaluation.scores.forEach(scoreItem => {
      if (scoreItem.lineId) {
        scoresMap[scoreItem.lineId] = scoreItem.score;
      }
    });
  }
  
  // Calculer les totaux
  form.sections.forEach(section => {
    if (section.lines && Array.isArray(section.lines)) {
      section.lines.forEach(line => {
        if (scoresMap[line._id] !== undefined) {
          totalScore += scoresMap[line._id];
          maxPossibleScore += line.maxScore || 20;
          totalLines++;
        }
      });
    }
  });
  
  const globalPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  
  // === SECTION 1: INFORMATIONS GÉNÉRALES ===
  csvLines.push('RAPPORT D\'ÉVALUATION');
  csvLines.push('');
  csvLines.push('INFORMATIONS GÉNÉRALES');
  csvLines.push('Propriété,Valeur');
  csvLines.push(`"Formulaire","${form.title}"`);
  csvLines.push(`"Description","${(form.description || 'N/A').replace(/"/g, '""')}"`);
  
  if (evaluation.studentId) {
    csvLines.push(`"Étudiant évalué","${evaluation.studentName || 'N/A'}"`);
    csvLines.push(`"Type d'évaluation","Individuelle"`);
  } else {
    csvLines.push(`"Groupe évalué","Groupe ${evaluation.groupNumber}"`);
    csvLines.push(`"Type d'évaluation","Groupe"`);
  }
  
  csvLines.push(`"Professeur évaluateur","${evaluation.professorName || 'N/A'}"`);
  csvLines.push(`"Date de création","${formatDate(evaluation.createdAt)}"`);
  csvLines.push(`"Date de modification","${formatDate(evaluation.updatedAt)}"`);
  csvLines.push(`"Statut","${evaluation.progress === 100 ? 'Terminée' : 'En cours'}"`);
  csvLines.push('');
  
  // === SECTION 2: RÉSUMÉ DES SCORES ===
  csvLines.push('RÉSUMÉ DES SCORES');
  csvLines.push('Métrique,Valeur');
  csvLines.push(`"Score total obtenu",${totalScore}`);
  csvLines.push(`"Score maximum possible",${maxPossibleScore}`);
  csvLines.push(`"Pourcentage global",${globalPercentage}%`);
  csvLines.push(`"Nombre de critères évalués",${totalLines}`);
  
  if (totalLines > 0) {
    const averageScore = Math.round((totalScore / totalLines) * 100) / 100;
    csvLines.push(`"Score moyen par critère",${averageScore}`);
  }
  
  // Niveau d'appréciation avec couleur (commentaire pour Excel)
  let appreciation = 'Non évalué';
  let appreciationComment = '';
  if (globalPercentage >= 90) {
    appreciation = 'Excellent';
    appreciationComment = 'Performance exceptionnelle';
  } else if (globalPercentage >= 80) {
    appreciation = 'Très bien';
    appreciationComment = 'Performance très satisfaisante';
  } else if (globalPercentage >= 70) {
    appreciation = 'Bien';
    appreciationComment = 'Performance satisfaisante';
  } else if (globalPercentage >= 60) {
    appreciation = 'Assez bien';
    appreciationComment = 'Performance acceptable';
  } else if (globalPercentage >= 50) {
    appreciation = 'Passable';
    appreciationComment = 'Performance minimale';
  } else if (globalPercentage > 0) {
    appreciation = 'Insuffisant';
    appreciationComment = 'Performance en dessous des attentes';
  }
  
  csvLines.push(`"Appréciation globale","${appreciation}"`);
  csvLines.push(`"Commentaire","${appreciationComment}"`);
  csvLines.push('');
  
  // === SECTION 3: DÉTAIL PAR SECTION ===
  csvLines.push('PERFORMANCE PAR SECTION');
  csvLines.push('Section,Score Obtenu,Score Maximum,Pourcentage,Nombre de Critères,Appréciation');
  
  form.sections.forEach(section => {
    if (section.lines && Array.isArray(section.lines)) {
      let sectionScore = 0;
      let sectionMaxScore = 0;
      let sectionLines = 0;
      
      section.lines.forEach(line => {
        if (scoresMap[line._id] !== undefined) {
          sectionScore += scoresMap[line._id];
          sectionMaxScore += line.maxScore || 20;
          sectionLines++;
        }
      });
      
      if (sectionLines > 0) {
        const sectionPercentage = sectionMaxScore > 0 ? Math.round((sectionScore / sectionMaxScore) * 100) : 0;
        const sectionTitle = (section.title || 'Section sans titre').replace(/"/g, '""');
        
        let sectionAppreciation = 'Non évalué';
        if (sectionPercentage >= 90) sectionAppreciation = 'Excellent';
        else if (sectionPercentage >= 80) sectionAppreciation = 'Très bien';
        else if (sectionPercentage >= 70) sectionAppreciation = 'Bien';
        else if (sectionPercentage >= 60) sectionAppreciation = 'Assez bien';
        else if (sectionPercentage >= 50) sectionAppreciation = 'Passable';
        else if (sectionPercentage > 0) sectionAppreciation = 'Insuffisant';
        
        csvLines.push(`"${sectionTitle}",${sectionScore},${sectionMaxScore},${sectionPercentage}%,${sectionLines},"${sectionAppreciation}"`);
      }
    }
  });
  
  csvLines.push('');
  
  // === SECTION 4: DÉTAIL DE CHAQUE CRITÈRE ===
  csvLines.push('DÉTAIL DES CRITÈRES D\'ÉVALUATION');
  csvLines.push('Section,Critère,Score Obtenu,Score Maximum,Pourcentage,Type de Notation,Commentaire');
  
  form.sections.forEach(section => {
    if (section.lines && Array.isArray(section.lines)) {
      section.lines.forEach(line => {
        const score = scoresMap[line._id];
        const maxScore = line.maxScore || 20;
        
        if (score !== undefined) {
          const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
          const sectionTitle = (section.title || 'Section sans titre').replace(/"/g, '""');
          const lineTitle = (line.title || 'Critère sans titre').replace(/"/g, '""');
          
          // Type de notation
          let notationType = 'Échelle';
          if (line.type === 'binary') {
            notationType = 'Binaire (Oui/Non)';
          } else if (line.type === 'scale') {
            notationType = 'Échelle (0-8)';
          }
          
          // Commentaire basé sur le score
          let comment = '';
          if (line.type === 'binary') {
            comment = score === 1 ? 'Critère validé' : 'Critère non validé';
          } else {
            if (percentage >= 90) comment = 'Performance excellente';
            else if (percentage >= 80) comment = 'Performance très bonne';
            else if (percentage >= 70) comment = 'Performance bonne';
            else if (percentage >= 60) comment = 'Performance satisfaisante';
            else if (percentage >= 50) comment = 'Performance acceptable';
            else comment = 'Performance à améliorer';
          }
          
          csvLines.push(`"${sectionTitle}","${lineTitle}",${score},${maxScore},${percentage}%,"${notationType}","${comment}"`);
        }
      });
    }
  });
  
  csvLines.push('');
  
  // === SECTION 5: MÉTADONNÉES ===
  csvLines.push('MÉTADONNÉES DU RAPPORT');
  csvLines.push('Information,Valeur');
  csvLines.push(`"Date de génération du rapport","${new Date().toLocaleString('fr-FR')}"`);
  csvLines.push(`"Version du formulaire","${form.version || '1.0'}"`);
  csvLines.push(`"ID de l'évaluation","${evaluation._id}"`);
  csvLines.push(`"ID du formulaire","${form._id}"`);
  csvLines.push(`"Système","EvalMe IUT NFC"`);
  csvLines.push('');
  
  // === SECTION 6: LÉGENDE ===
  csvLines.push('LÉGENDE DES APPRÉCIATIONS');
  csvLines.push('Pourcentage,Appréciation,Description');
  csvLines.push('"90% et plus","Excellent","Performance exceptionnelle dépassant les attentes"');
  csvLines.push('"80% à 89%","Très bien","Performance très satisfaisante"');
  csvLines.push('"70% à 79%","Bien","Performance satisfaisante"');
  csvLines.push('"60% à 69%","Assez bien","Performance acceptable"');
  csvLines.push('"50% à 59%","Passable","Performance minimale requise"');
  csvLines.push('"Moins de 50%","Insuffisant","Performance en dessous des attentes"');
  
  // Ajouter BOM UTF-8 pour Excel
  return '\ufeff' + csvLines.join('\n');
};

const exportAllEvaluationsCSV = async () => {
  try {
    if (filteredEvaluations.value.length === 0) {
      showNotification('Aucune évaluation à exporter', 'warning');
      return;
    }
    
    showNotification('Préparation de l\'export en cours...', 'info');
    
    // Récupérer les détails de toutes les évaluations
    const evaluationDetails = [];
    
    for (const evaluation of filteredEvaluations.value) {
      try {
        const response = await fetch(`http://localhost:5000/api/evaluations/${evaluation._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const details = await response.json();
          evaluationDetails.push(details);
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'évaluation ${evaluation._id}:`, error);
      }
    }
    
    if (evaluationDetails.length === 0) {
      showNotification('Aucune évaluation valide trouvée', 'error');
      return;
    }
    
    // Générer le CSV global
    const csvData = generateAllEvaluationsCSV(evaluationDetails);
    
    // Créer et télécharger le fichier CSV
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nom du fichier avec date
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `export_evaluations_${date}_${time}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`Export de ${evaluationDetails.length} évaluations réalisé avec succès`, 'success');
    
  } catch (error) {
    console.error('Erreur lors de l\'export global:', error);
    showNotification('Erreur lors de l\'export global: ' + error.message, 'error');
  }
};

const generateAllEvaluationsCSV = (evaluations) => {
  const csvLines = [];
  
  // === EN-TÊTE DU RAPPORT GLOBAL ===
  csvLines.push('EXPORT GLOBAL DES ÉVALUATIONS');
  csvLines.push(`Généré le: ${new Date().toLocaleString('fr-FR')}`);
  csvLines.push(`Nombre total d'évaluations: ${evaluations.length}`);
  csvLines.push('');
  
  // === CALCUL DES STATISTIQUES GLOBALES ===
  const stats = {
    totalEvaluations: evaluations.length,
    completedEvaluations: 0,
    inProgressEvaluations: 0,
    averageGlobalScore: 0,
    formsUsed: new Set(),
    studentsEvaluated: new Set(),
    groupsEvaluated: new Set(),
    totalScoreSum: 0,
    totalMaxScoreSum: 0,
    byForm: new Map(),
    byStatus: { completed: 0, inProgress: 0 },
    scoreDistribution: { excellent: 0, veryGood: 0, good: 0, fair: 0, passable: 0, insufficient: 0 }
  };
  
  evaluations.forEach(evaluation => {
    // Trouver le formulaire correspondant
    const form = allForms.value.find(f => {
      const formId = typeof evaluation.form === 'object' ? evaluation.form._id : evaluation.form;
      return f._id === formId;
    });
    
    if (form) {
      stats.formsUsed.add(form.title);
      
      // Initialiser les stats par formulaire
      if (!stats.byForm.has(form.title)) {
        stats.byForm.set(form.title, { count: 0, totalScore: 0, maxScore: 0 });
      }
      
      // Calculer le score de cette évaluation
      let evalScore = 0;
      let evalMaxScore = 0;
      
      if (evaluation.scores && Array.isArray(evaluation.scores)) {
        const scoresMap = {};
        evaluation.scores.forEach(scoreItem => {
          if (scoreItem.lineId) {
            scoresMap[scoreItem.lineId] = scoreItem.score;
          }
        });
        
        form.sections.forEach(section => {
          if (section.lines) {
            section.lines.forEach(line => {
              if (scoresMap[line._id] !== undefined) {
                evalScore += scoresMap[line._id];
                evalMaxScore += line.maxScore || 20;
              }
            });
          }
        });
      }
      
      stats.totalScoreSum += evalScore;
      stats.totalMaxScoreSum += evalMaxScore;
      
      // Stats par formulaire
      const formStats = stats.byForm.get(form.title);
      formStats.count++;
      formStats.totalScore += evalScore;
      formStats.maxScore += evalMaxScore;
      
      // Statut de l'évaluation
      if (evaluation.progress === 100) {
        stats.completedEvaluations++;
        stats.byStatus.completed++;
      } else {
        stats.inProgressEvaluations++;
        stats.byStatus.inProgress++;
      }
      
      // Distribution des scores
      const percentage = evalMaxScore > 0 ? Math.round((evalScore / evalMaxScore) * 100) : 0;
      if (percentage >= 90) stats.scoreDistribution.excellent++;
      else if (percentage >= 80) stats.scoreDistribution.veryGood++;
      else if (percentage >= 70) stats.scoreDistribution.good++;
      else if (percentage >= 60) stats.scoreDistribution.fair++;
      else if (percentage >= 50) stats.scoreDistribution.passable++;
      else if (percentage > 0) stats.scoreDistribution.insufficient++;
      
      // Entités évaluées
      if (evaluation.studentId) {
        stats.studentsEvaluated.add(evaluation.studentName || evaluation.studentId);
      } else {
        stats.groupsEvaluated.add(evaluation.groupNumber);
      }
    }
  });
  
  stats.averageGlobalScore = stats.totalMaxScoreSum > 0 ? Math.round((stats.totalScoreSum / stats.totalMaxScoreSum) * 100) : 0;
  
  // === SECTION 1: RÉSUMÉ EXÉCUTIF ===
  csvLines.push('RÉSUMÉ EXÉCUTIF');
  csvLines.push('Métrique,Valeur,Pourcentage');
  csvLines.push(`"Nombre total d'évaluations",${stats.totalEvaluations},100%`);
  csvLines.push(`"Évaluations terminées",${stats.completedEvaluations},${Math.round((stats.completedEvaluations / stats.totalEvaluations) * 100)}%`);
  csvLines.push(`"Évaluations en cours",${stats.inProgressEvaluations},${Math.round((stats.inProgressEvaluations / stats.totalEvaluations) * 100)}%`);
  csvLines.push(`"Score moyen global",${stats.averageGlobalScore}%,N/A`);
  csvLines.push(`"Nombre de formulaires utilisés",${stats.formsUsed.size},N/A`);
  csvLines.push(`"Étudiants évalués",${stats.studentsEvaluated.size},N/A`);
  csvLines.push(`"Groupes évalués",${stats.groupsEvaluated.size},N/A`);
  csvLines.push('');
  
  // === SECTION 2: DISTRIBUTION DES PERFORMANCES ===
  csvLines.push('DISTRIBUTION DES PERFORMANCES');
  csvLines.push('Niveau,Nombre d\'évaluations,Pourcentage,Plage de scores');
  const total = stats.totalEvaluations;
  csvLines.push(`"Excellent",${stats.scoreDistribution.excellent},${Math.round((stats.scoreDistribution.excellent / total) * 100)}%,"90% et plus"`);
  csvLines.push(`"Très bien",${stats.scoreDistribution.veryGood},${Math.round((stats.scoreDistribution.veryGood / total) * 100)}%,"80% à 89%"`);
  csvLines.push(`"Bien",${stats.scoreDistribution.good},${Math.round((stats.scoreDistribution.good / total) * 100)}%,"70% à 79%"`);
  csvLines.push(`"Assez bien",${stats.scoreDistribution.fair},${Math.round((stats.scoreDistribution.fair / total) * 100)}%,"60% à 69%"`);
  csvLines.push(`"Passable",${stats.scoreDistribution.passable},${Math.round((stats.scoreDistribution.passable / total) * 100)}%,"50% à 59%"`);
  csvLines.push(`"Insuffisant",${stats.scoreDistribution.insufficient},${Math.round((stats.scoreDistribution.insufficient / total) * 100)}%,"Moins de 50%"`);
  csvLines.push('');
  
  // === SECTION 3: PERFORMANCE PAR FORMULAIRE ===
  csvLines.push('PERFORMANCE PAR FORMULAIRE');
  csvLines.push('Formulaire,Nombre d\'évaluations,Score moyen,Performance globale');
  stats.byForm.forEach((formStats, formTitle) => {
    const avgPercentage = formStats.maxScore > 0 ? Math.round((formStats.totalScore / formStats.maxScore) * 100) : 0;
    let performance = 'Non évaluée';
    if (avgPercentage >= 90) performance = 'Excellente';
    else if (avgPercentage >= 80) performance = 'Très bonne';
    else if (avgPercentage >= 70) performance = 'Bonne';
    else if (avgPercentage >= 60) performance = 'Satisfaisante';
    else if (avgPercentage >= 50) performance = 'Acceptable';
    else if (avgPercentage > 0) performance = 'À améliorer';
    
    csvLines.push(`"${formTitle.replace(/"/g, '""')}",${formStats.count},${avgPercentage}%,"${performance}"`);
  });
  csvLines.push('');
  
  // === SECTION 4: LISTE DÉTAILLÉE DES ÉVALUATIONS ===
  csvLines.push('LISTE DÉTAILLÉE DES ÉVALUATIONS');
  csvLines.push('ID,Formulaire,Type d\'évaluation,Entité évaluée,Professeur,Score Total,Score Maximum,Pourcentage,Appréciation,Statut,Date de création,Date de modification');
  
  evaluations.forEach(evaluation => {
    const form = allForms.value.find(f => {
      const formId = typeof evaluation.form === 'object' ? evaluation.form._id : evaluation.form;
      return f._id === formId;
    });
    
    const formTitle = form ? form.title.replace(/"/g, '""') : 'Formulaire inconnu';
    const type = evaluation.studentId ? 'Individuelle' : 'Groupe';
    const entity = evaluation.studentId 
      ? (evaluation.studentName || 'Étudiant inconnu').replace(/"/g, '""')
      : `Groupe ${evaluation.groupNumber}`;
    const evaluator = (evaluation.professorName || 'Évaluateur inconnu').replace(/"/g, '""');
    
    // Calculer le score
    let evalScore = 0;
    let evalMaxScore = 0;
    
    if (form && evaluation.scores && Array.isArray(evaluation.scores)) {
      const scoresMap = {};
      evaluation.scores.forEach(scoreItem => {
        if (scoreItem.lineId) {
          scoresMap[scoreItem.lineId] = scoreItem.score;
        }
      });
      
      form.sections.forEach(section => {
        if (section.lines) {
          section.lines.forEach(line => {
            if (scoresMap[line._id] !== undefined) {
              evalScore += scoresMap[line._id];
              evalMaxScore += line.maxScore || 20;
            }
          });
        }
      });
    }
    
    const percentage = evalMaxScore > 0 ? Math.round((evalScore / evalMaxScore) * 100) : 0;
    
    // Appréciation
    let appreciation = 'Non évaluée';
    if (percentage >= 90) appreciation = 'Excellent';
    else if (percentage >= 80) appreciation = 'Très bien';
    else if (percentage >= 70) appreciation = 'Bien';
    else if (percentage >= 60) appreciation = 'Assez bien';
    else if (percentage >= 50) appreciation = 'Passable';
    else if (percentage > 0) appreciation = 'Insuffisant';
    
    const status = evaluation.progress === 100 ? 'Terminée' : 'En cours';
    const createdAt = formatDate(evaluation.createdAt);
    const updatedAt = formatDate(evaluation.updatedAt);
    
    csvLines.push(`"${evaluation._id}","${formTitle}","${type}","${entity}","${evaluator}",${evalScore},${evalMaxScore},${percentage}%,"${appreciation}","${status}","${createdAt}","${updatedAt}"`);
  });
  
  csvLines.push('');
  
  // === SECTION 5: MÉTADONNÉES ===
  csvLines.push('MÉTADONNÉES DE L\'EXPORT');
  csvLines.push('Information,Valeur');
  csvLines.push(`"Date et heure de génération","${new Date().toLocaleString('fr-FR')}"`);
  csvLines.push(`"Système","EvalMe IUT NFC"`);
  csvLines.push(`"Version de l'export","2.0"`);
  csvLines.push(`"Période d'export","${evaluations.length > 0 ? formatDate(Math.min(...evaluations.map(e => new Date(e.createdAt)))) : 'N/A'} - ${evaluations.length > 0 ? formatDate(Math.max(...evaluations.map(e => new Date(e.updatedAt || e.createdAt)))) : 'N/A'}"`);
  csvLines.push(`"Formulaires concernés","${Array.from(stats.formsUsed).join('; ')}"`);
  csvLines.push('');
  
  // === SECTION 6: NOTES ET RECOMMANDATIONS ===
  csvLines.push('NOTES ET RECOMMANDATIONS');
  csvLines.push('Type,Description');
  
  // Recommandations basées sur les statistiques
  if (stats.averageGlobalScore < 60) {
    csvLines.push('"Attention","Le score moyen global est inférieur à 60%. Il est recommandé de revoir les critères d\'évaluation ou d\'améliorer la formation."');
  } else if (stats.averageGlobalScore >= 90) {
    csvLines.push('"Félicitations","Excellente performance globale ! Les objectifs pédagogiques semblent être bien atteints."');
  }
  
  if (stats.inProgressEvaluations > stats.completedEvaluations) {
    csvLines.push('"Information","Plus d\'évaluations sont en cours que terminées. Pensez à relancer les évaluateurs."');
  }
  
  csvLines.push('"Format","Ce fichier est optimisé pour Excel. Les colonnes peuvent être redimensionnées pour une meilleure lisibilité."');
  csvLines.push('"Support","Pour toute question technique, contactez l\'équipe support EvalMe IUT NFC."');
  
  // Ajouter BOM UTF-8 pour Excel
  return '\ufeff' + csvLines.join('\n');
};

// Watchers
watch([searchEvaluations, filterFormId, filterStatus], () => {
  filterEvaluations();
});

// Lifecycle
onMounted(async () => {
  console.log('EvaluationsPage montée - Chargement des données...');
  await fetchStudents();
  await fetchValidForms();
  await fetchEvaluations();
});
</script>

<style scoped>
.v-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.v-data-table {
  border-radius: 12px;
}

.v-chip {
  font-weight: 500;
}

.v-dialog {
  transition: all 0.3s ease;
}

.v-expansion-panels {
  border-radius: 8px;
  overflow: hidden;
}

.v-expansion-panel {
  border: 1px solid #e0e0e0;
  margin-bottom: 8px;
  border-radius: 8px !important;
}

.v-expansion-panel-title {
  background-color: #f8f9fa;
}

.v-expansion-panel-text {
  background-color: #ffffff;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-list-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.v-list-item:hover {
  background-color: #f5f5f5;
}

.v-slider {
  margin: 16px 0;
}

.v-radio-group {
  margin: 8px 0;
}

.v-progress-linear {
  border-radius: 4px;
}

/* Styles pour les critères d'évaluation */
.evaluation-criteria .v-card {
  transition: all 0.2s;
  border: 2px solid transparent;
}

.evaluation-criteria .v-card:hover {
  border-color: #1976d2;
  transform: translateY(-1px);
}

/* Animation pour les progress bars */
.v-progress-linear .v-progress-linear__background {
  transition: all 0.3s ease;
}

/* Responsive design */
@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
  }
  
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-expansion-panel-text .v-card-text {
    padding: 8px !important;
  }
}

/* Style pour les alertes et notifications */
.v-alert {
  border-radius: 8px;
}

.v-snackbar {
  border-radius: 8px;
}

/* Style pour les boutons d'action */
.v-btn--icon {
  transition: all 0.2s;
}

.v-btn--icon:hover {
  transform: scale(1.1);
}

/* Style pour les champs de formulaire */
.v-text-field, .v-select {
  margin-bottom: 8px;
}

/* Style pour les sections vides */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state .v-icon {
  opacity: 0.5;
}

/* Animation pour le chargement */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* Style pour les tooltips */
.v-tooltip .v-overlay__content {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
