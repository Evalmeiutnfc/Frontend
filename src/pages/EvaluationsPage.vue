<template>
  <v-container fluid class="pa-4">
    <!-- En-tête modernisé -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-clipboard-check
              </v-icon>
              Gestion des évaluations
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Créez et gérez vos évaluations basées sur les formulaires
            </p>
          </div>
          <div class="d-flex gap-2">
            <v-btn
              color="success"
              variant="outlined"
              prepend-icon="mdi-download"
              @click="exportAllEvaluations"
              :disabled="filteredEvaluations.length === 0"
            >
              Exporter tout
            </v-btn>
            <v-btn
              color="primary"
              size="large"
              @click="openNewEvaluationDialog"
              prepend-icon="mdi-plus"
              variant="elevated"
              class="text-h6"
            >
              Nouvelle évaluation
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-text class="pa-6">
            <!-- Filtres et recherche -->
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="search"
                  label="Rechercher une évaluation"
                  placeholder="Formulaire, étudiant..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedForm"
                  :items="formOptions"
                  label="Filtrer par formulaire"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-clipboard-text"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedPromotion"
                  :items="promotionOptions"
                  label="Filtrer par promotion"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-school"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedGroup"
                  :items="groupOptions"
                  label="Filtrer par groupe"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-account-group"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
            </v-row>

            <!-- Tableau des évaluations -->
            <v-data-table
              :headers="headers"
              :items="filteredEvaluations"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des évaluations..."
              no-data-text="Aucune évaluation trouvée"
              items-per-page-text="Évaluations par page"
              @update:options="handleTableOptions"
            >
              <!-- Formulaire -->
              <template v-slot:item.form="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="32" class="mr-3">
                    <v-icon color="white">mdi-clipboard-text</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.form?.title }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.form?.associationType === 'student' ? 'Individuelle' : 'Groupe' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Cible de l'évaluation -->
              <template v-slot:item.target="{ item }">
                <div v-if="item.student">
                  <v-chip
                    color="green"
                    size="small"
                    variant="flat"
                    prepend-icon="mdi-account"
                    class="font-weight-medium"
                  >
                    {{ item.student.firstName }} {{ item.student.lastName }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-1">
                    N° {{ item.student.studentNumber }}
                  </div>
                </div>
                <div v-else>
                  <v-chip
                    color="blue"
                    size="small"
                    variant="flat"
                    prepend-icon="mdi-account-group"
                    class="font-weight-medium"
                  >
                    Groupe {{ item.groupNumber }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-1" v-if="item.subgroup">
                    {{ item.subgroup }}
                  </div>
                </div>
              </template>

              <!-- Promotion/Groupe -->
              <template v-slot:item.context="{ item }">
                <div>
                  <div v-if="item.promotion" class="text-body-2">
                    <v-icon size="small" class="mr-1">mdi-school</v-icon>
                    {{ item.promotion.name }}
                  </div>
                  <div v-if="item.group" class="text-caption text-medium-emphasis">
                    <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                    {{ item.group.name }}
                  </div>
                </div>
              </template>

              <!-- Scores -->
              <template v-slot:item.scores="{ item }">
                <div class="d-flex align-center">
                  <v-progress-circular
                    :model-value="getScorePercentage(item)"
                    :color="getScoreColor(item)"
                    :size="32"
                    :width="3"
                    class="mr-2"
                  >
                    <span class="text-caption">{{ item.scores?.length || 0 }}</span>
                  </v-progress-circular>
                  <div>
                    <div class="text-body-2">{{ item.scores?.length || 0 }} critères</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getScorePercentage(item) }}% complété
                    </div>
                  </div>
                </div>
              </template>

              <!-- Professeur -->
              <template v-slot:item.professor="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-account-tie</v-icon>
                  <span>{{ item.professor?.firstName }} {{ item.professor?.lastName }}</span>
                </div>
              </template>

              <!-- Date de création -->
              <template v-slot:item.createdAt="{ item }">
                <div class="text-caption">
                  {{ formatDate(item.createdAt) }}
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    color="info"
                    size="small"
                    @click="viewEvaluation(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les détails</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="editEvaluation(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-download"
                    variant="text"
                    color="success"
                    size="small"
                    @click="exportEvaluation(item)"
                  >
                    <v-icon size="small">mdi-download</v-icon>
                    <v-tooltip activator="parent" location="top">Exporter</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDeleteEvaluation(item)"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">Supprimer</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de sélection de formulaire -->
    <v-dialog v-model="selectFormDialog" max-width="700px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              mdi-clipboard-plus
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">Sélectionner un formulaire</h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                Choisissez un formulaire pour créer une nouvelle évaluation
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-text-field
            v-model="searchForms"
            label="Rechercher un formulaire"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-4"
            clearable
          />
          
          <div v-if="loadingForms" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <div class="text-h6 mt-4">Chargement des formulaires...</div>
          </div>
          
          <v-list v-else-if="filteredValidForms.length > 0" class="rounded">
            <v-list-item
              v-for="form in filteredValidForms"
              :key="form._id"
              @click="selectForm(form)"
              class="mb-2 pa-4"
              variant="outlined"
              rounded
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="40">
                  <v-icon color="white">mdi-clipboard-text</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-medium mb-1">
                {{ form.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="mb-2">
                {{ form.associationType === 'student' ? 'Évaluation individuelle' : 'Évaluation par groupe' }}
                • Valide jusqu'au {{ formatDate(form.validTo) }}
              </v-list-item-subtitle>
              
              <div class="d-flex align-center gap-2">
                <v-chip size="small" color="success" variant="flat">
                  {{ getFormStatus(form) }}
                </v-chip>
                <v-chip size="small" color="info" variant="outlined">
                  {{ form.sections?.length || 0 }} section{{ (form.sections?.length || 0) > 1 ? 's' : '' }}
                </v-chip>
              </div>
              
              <template v-slot:append>
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-remove</v-icon>
            <div class="text-h6 mb-2">Aucun formulaire disponible</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ searchForms ? 'Aucun formulaire ne correspond à votre recherche' : 'Aucun formulaire n\'est disponible pour évaluation actuellement' }}
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="selectFormDialog = false"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'évaluation -->
    <v-dialog v-model="evaluationDialog" max-width="1000px" persistent>
      <v-card v-if="selectedFormData" class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ currentEvaluation._id ? 'mdi-clipboard-edit' : 'mdi-clipboard-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ currentEvaluation._id ? 'Modifier' : 'Nouvelle' }} évaluation
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedFormData.title }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6" style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="evaluationFormRef" v-model="evaluationFormValid">
            <!-- Informations de l'évaluation -->
            <v-row class="mb-6">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                  Informations de l'évaluation
                </h4>
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'student'">
                <v-select
                  v-model="currentEvaluation.student"
                  :items="availableStudents"
                  label="Étudiant à évaluer"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  item-title="fullName"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'group'">
                <v-text-field
                  v-model.number="currentEvaluation.groupNumber"
                  label="Numéro de groupe"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  :rules="[rules.required, rules.isNumber]"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="currentEvaluation.promotion"
                  :items="availablePromotions"
                  label="Promotion"
                  prepend-inner-icon="mdi-school"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="_id"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="currentEvaluation.group"
                  :items="availableGroups"
                  label="Groupe TD"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="_id"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'group'">
                <v-text-field
                  v-model="currentEvaluation.subgroup"
                  label="Sous-groupe (optionnel)"
                  prepend-inner-icon="mdi-account-multiple"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Ex: TP1, Projet A"
                />
              </v-col>
            </v-row>

            <!-- Sections d'évaluation -->
            <div v-if="hasValidTarget">
              <h4 class="text-h6 font-weight-medium mb-3">
                <v-icon color="primary" class="mr-2">mdi-clipboard-check</v-icon>
                Critères d'évaluation
              </h4>
              
              <v-expansion-panels v-model="expandedSections" multiple variant="accordion">
                <v-expansion-panel
                  v-for="(section, sectionIndex) in selectedFormData.sections"
                  :key="sectionIndex"
                  class="mb-2"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                      <v-icon class="mr-3">mdi-folder-outline</v-icon>
                      <div class="flex-grow-1">
                        <div class="font-weight-medium">{{ section.title }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ section.lines.length }} critère{{ section.lines.length > 1 ? 's' : '' }}
                        </div>
                      </div>
                      <v-chip size="small" :color="getSectionCompletionColor(sectionIndex)" variant="flat">
                        {{ getCompletedCriteria(sectionIndex) }}/{{ section.lines.length }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col
                        v-for="(line, lineIndex) in section.lines"
                        :key="lineIndex"
                        cols="12"
                        md="6"
                      >
                        <v-card variant="outlined" class="pa-4">
                          <div class="text-subtitle-2 mb-3 font-weight-medium">
                            {{ line.title }}
                          </div>
                          
                          <div class="mb-3">
                            <v-chip size="small" :color="line.type === 'binary' ? 'orange' : 'blue'" variant="outlined">
                              {{ line.type === 'binary' ? 'Oui/Non' : 'Échelle 0-8' }}
                            </v-chip>
                            <v-chip size="small" color="grey" variant="outlined" class="ml-1">
                              Max: {{ line.maxScore }}
                            </v-chip>
                          </div>
                          
                          <!-- Notation binaire -->
                          <div v-if="line.type === 'binary'">
                            <v-radio-group
                              v-model="currentEvaluation.scores[line._id]"
                              inline
                              hide-details
                            >
                              <v-radio label="Non" :value="0" color="error" />
                              <v-radio label="Oui" :value="1" color="success" />
                            </v-radio-group>
                          </div>
                          
                          <!-- Notation par échelle -->
                          <div v-else-if="line.type === 'scale'">
                            <v-slider
                              v-model="currentEvaluation.scores[line._id]"
                              :min="0"
                              :max="line.maxScore"
                              :step="1"
                              show-ticks="always"
                              tick-size="4"
                              thumb-label
                              color="primary"
                            >
                              <template v-slot:thumb-label="{ modelValue }">
                                {{ modelValue }}/{{ line.maxScore }}
                              </template>
                            </v-slider>
                            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                              <span>0 - Insuffisant</span>
                              <span>{{ Math.floor(line.maxScore / 2) }} - Satisfaisant</span>
                              <span>{{ line.maxScore }} - Excellent</span>
                            </div>
                          </div>
                          
                          <div class="mt-2 text-caption">
                            <v-chip size="x-small" :color="line.notationType === 'common' ? 'green' : line.notationType === 'individual' ? 'blue' : 'orange'" variant="flat">
                              {{ getNotationTypeLabel(line.notationType) }}
                            </v-chip>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>

            <!-- Résumé de progression -->
            <div v-if="hasValidTarget && Object.keys(currentEvaluation.scores).length > 0" class="mt-6">
              <v-card variant="tonal" color="info">
                <v-card-text>
                  <div class="d-flex align-center mb-3">
                    <v-icon class="mr-2">mdi-chart-line</v-icon>
                    <span class="font-weight-medium">Progression de l'évaluation</span>
                  </div>
                  <v-progress-linear
                    :model-value="evaluationProgress"
                    :color="evaluationProgress === 100 ? 'success' : 'info'"
                    height="8"
                    rounded
                    class="mb-2"
                  />
                  <div class="text-body-2">
                    {{ Object.keys(currentEvaluation.scores).length }} critères sur {{ totalCriteria }} évalués ({{ evaluationProgress }}%)
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="closeEvaluationDialog"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveEvaluation"
            :loading="saving"
            :disabled="!canSaveEvaluation"
            prepend-icon="mdi-check"
          >
            {{ currentEvaluation._id ? 'Modifier' : 'Créer' }}
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
import { ref, onMounted, computed } from 'vue';

// État de la page
const loading = ref(false);
const saving = ref(false);
const loadingForms = ref(false);
const evaluations = ref([]);
const filteredEvaluations = ref([]);
const validForms = ref([]);
const availableStudents = ref([]);
const availablePromotions = ref([]);
const availableGroups = ref([]);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Filtres
const search = ref('');
const selectedForm = ref(null);
const selectedPromotion = ref(null);
const selectedGroup = ref(null);
const searchForms = ref('');

// Dialogs
const selectFormDialog = ref(false);
const evaluationDialog = ref(false);
const deleteDialog = ref(false);

// État de l'évaluation
const selectedFormData = ref(null);
const currentEvaluation = ref({
  _id: null,
  form: null,
  professor: null,
  student: null,
  groupNumber: 0,
  scores: {},
  promotion: null,
  group: null,
  subgroup: ''
});

const expandedSections = ref([]);
const evaluationFormRef = ref(null);
const evaluationFormValid = ref(false);
const evaluationToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// En-têtes du tableau
const headers = ref([
  { title: 'Formulaire', align: 'start', key: 'form', sortable: false },
  { title: 'Cible', align: 'start', key: 'target', sortable: false },
  { title: 'Contexte', align: 'start', key: 'context', sortable: false },
  { title: 'Scores', align: 'start', key: 'scores', sortable: false },
  { title: 'Professeur', align: 'start', key: 'professor' },
  { title: 'Date', align: 'start', key: 'createdAt' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  isNumber: v => !isNaN(parseFloat(v)) && isFinite(v) || 'Doit être un nombre'
};

// Options pour les filtres
const formOptions = computed(() => {
  const options = [{ title: 'Tous les formulaires', value: null }];
  validForms.value.forEach(form => {
    options.push({ title: form.title, value: form._id });
  });
  return options;
});

const promotionOptions = computed(() => {
  const options = [{ title: 'Toutes les promotions', value: null }];
  availablePromotions.value.forEach(promotion => {
    options.push({ title: `${promotion.name} (${promotion.year})`, value: promotion._id });
  });
  return options;
});

const groupOptions = computed(() => {
  const options = [{ title: 'Tous les groupes', value: null }];
  availableGroups.value.forEach(group => {
    options.push({ title: group.name, value: group._id });
  });
  return options;
});

const filteredValidForms = computed(() => {
  if (!searchForms.value) return validForms.value;
  return validForms.value.filter(form =>
    form.title.toLowerCase().includes(searchForms.value.toLowerCase())
  );
});

const hasValidTarget = computed(() => {
  if (selectedFormData.value?.associationType === 'student') {
    return !!currentEvaluation.value.student;
  } else {
    return currentEvaluation.value.groupNumber > 0;
  }
});

const totalCriteria = computed(() => {
  if (!selectedFormData.value) return 0;
  return selectedFormData.value.sections?.reduce((total, section) => {
    return total + (section.lines?.length || 0);
  }, 0) || 0;
});

const evaluationProgress = computed(() => {
  const completed = Object.keys(currentEvaluation.value.scores).length;
  const total = totalCriteria.value;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

const canSaveEvaluation = computed(() => {
  return evaluationFormValid.value && hasValidTarget.value && Object.keys(currentEvaluation.value.scores).length > 0;
});

// Chargement des données
onMounted(async () => {
  await Promise.all([
    loadEvaluations(),
    loadValidForms(),
    loadStudents(),
    loadPromotions(),
    loadGroups()
  ]);
});

// Méthodes utilitaires
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getFormStatus = (form) => {
  const now = new Date();
  const validFrom = new Date(form.validFrom);
  const validTo = new Date(form.validTo);
  
  if (now < validFrom) return 'À venir';
  if (now > validTo) return 'Expiré';
  return 'Actif';
};

const getScorePercentage = (evaluation) => {
  const scoreCount = evaluation.scores?.length || 0;
  const totalCriteria = evaluation.form?.sections?.reduce((total, section) => {
    return total + (section.lines?.length || 0);
  }, 0) || 1;
  return Math.round((scoreCount / totalCriteria) * 100);
};

const getScoreColor = (evaluation) => {
  const percentage = getScorePercentage(evaluation);
  if (percentage === 100) return 'success';
  if (percentage > 50) return 'warning';
  return 'error';
};

const getSectionCompletionColor = (sectionIndex) => {
  const completed = getCompletedCriteria(sectionIndex);
  const total = selectedFormData.value.sections[sectionIndex].lines.length;
  const percentage = (completed / total) * 100;
  
  if (percentage === 100) return 'success';
  if (percentage > 50) return 'warning';
  return 'error';
};

const getCompletedCriteria = (sectionIndex) => {
  if (!selectedFormData.value) return 0;
  const section = selectedFormData.value.sections[sectionIndex];
  if (!section) return 0;
  
  return section.lines.filter(line => 
    currentEvaluation.value.scores[line._id] !== undefined
  ).length;
};

const getNotationTypeLabel = (type) => {
  const labels = {
    'common': 'Commune',
    'individual': 'Individuelle',
    'mixed': 'Mixte'
  };
  return labels[type] || type;
};

// Méthodes de chargement des données
const loadEvaluations = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.value.page);
    queryParams.append('limit', pagination.value.limit);
    
    if (selectedForm.value) queryParams.append('form', selectedForm.value);
    if (selectedPromotion.value) queryParams.append('promotion', selectedPromotion.value);
    if (selectedGroup.value) queryParams.append('group', selectedGroup.value);

    const response = await fetch(`http://localhost:5000/api/evaluations?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des évaluations');
    }

    const data = await response.json();
    evaluations.value = data.evaluations || [];
    filteredEvaluations.value = evaluations.value;
    
    if (data.pagination) {
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des évaluations',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const loadValidForms = async () => {
  loadingForms.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/forms', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      validForms.value = data.forms || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formulaires:', error);
  } finally {
    loadingForms.value = false;
  }
};

const loadStudents = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/students/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availableStudents.value = (data.students || data || []).map(student => ({
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
  }
};

const loadPromotions = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/promotions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availablePromotions.value = data.promotions || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error);
  }
};

const loadGroups = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availableGroups.value = data.groups || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des groupes:', error);
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadEvaluations();
};

const filterEvaluations = () => {
  loadEvaluations();
};

// Méthodes des dialogs
const openNewEvaluationDialog = () => {
  selectFormDialog.value = true;
};

const selectForm = (form) => {
  selectedFormData.value = form;
  resetCurrentEvaluation();
  currentEvaluation.value.form = form._id;
  selectFormDialog.value = false;
  evaluationDialog.value = true;
  expandedSections.value = form.sections?.map((_, index) => index) || [];
};

const resetCurrentEvaluation = () => {
  currentEvaluation.value = {
    _id: null,
    form: null,
    professor: null,
    student: null,
    groupNumber: 0,
    scores: {},
    promotion: null,
    group: null,
    subgroup: ''
  };
};

const closeEvaluationDialog = () => {
  evaluationDialog.value = false;
  selectedFormData.value = null;
  resetCurrentEvaluation();
};

// Méthodes CRUD
const saveEvaluation = async () => {
  if (!evaluationFormRef.value) return;
  
  const { valid } = await evaluationFormRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    // Transformer les scores en format attendu par l'API (avec lineId et score)
    const scores = Object.entries(currentEvaluation.value.scores).map(([lineId, score]) => ({
      lineId,
      score: Number(score)
    }));

    // Construire le payload selon le nouveau format de l'API
    const evaluationData = {
      formId: currentEvaluation.value.form,
      professorId: getCurrentUser()?.id,
      studentId: currentEvaluation.value.student || null,
      groupNumber: currentEvaluation.value.groupNumber || 0,
      scores,
      promotion: currentEvaluation.value.promotion || null,
      group: currentEvaluation.value.group || null,
      subgroup: currentEvaluation.value.subgroup || null
    };

    const url = currentEvaluation.value._id
      ? `http://localhost:5000/api/evaluations/update/${currentEvaluation.value._id}`
      : 'http://localhost:5000/api/evaluations/add';

    const method = currentEvaluation.value._id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(evaluationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de l'${currentEvaluation.value._id ? 'édition' : 'ajout'} de l'évaluation`);
    }

    const result = await response.json();

    snackbar.value = {
      show: true,
      text: result.message || `Évaluation ${currentEvaluation.value._id ? 'modifiée' : 'créée'} avec succès`,
      color: 'success'
    };

    closeEvaluationDialog();
    await loadEvaluations();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || `Erreur lors de l'${currentEvaluation.value._id ? 'édition' : 'ajout'} de l'évaluation`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const viewEvaluation = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/${item._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const evaluation = await response.json();
      selectedFormData.value = evaluation.form;
      
      // Convertir les scores en format pour l'édition (avec lineId comme clé)
      const scores = {};
      evaluation.scores.forEach(score => {
        scores[score.lineId] = score.score;
      });
      
      currentEvaluation.value = {
        _id: evaluation._id,
        form: evaluation.form._id,
        professor: evaluation.professor._id,
        student: evaluation.student?._id || null,
        groupNumber: evaluation.groupNumber || 0,
        scores,
        promotion: evaluation.promotion?._id || null,
        group: evaluation.group?._id || null,
        subgroup: evaluation.subgroup || ''
      };
      
      evaluationDialog.value = true;
      expandedSections.value = evaluation.form.sections?.map((_, index) => index) || [];
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement de l\'évaluation',
      color: 'error'
    };
  }
};

const editEvaluation = (item) => {
  viewEvaluation(item);
};

const exportEvaluation = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/export/${item.form._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.form.title}-evaluations.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      snackbar.value = {
        show: true,
        text: 'Export CSV réalisé avec succès',
        color: 'success'
      };
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de l\'export',
      color: 'error'
    };
  }
};

const exportAllEvaluations = async () => {
  // Implémentation de l'export global
  snackbar.value = {
    show: true,
    text: 'Fonctionnalité d\'export global en cours de développement',
    color: 'info'
  };
};

const confirmDeleteEvaluation = (item) => {
  evaluationToDelete.value = item;
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression de l\'évaluation');
    }

    const result = await response.json();

    snackbar.value = {
      show: true,
      text: result.message || 'Évaluation supprimée avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    evaluationToDelete.value = null;
    await loadEvaluations();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la suppression de l\'évaluation',
      color: 'error'
    };
  }
};

const getCurrentUser = () => {
  // Fonction utilitaire pour récupérer l'utilisateur actuel
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
  }
  return null;
};

// Validation des scores selon l'API
const validateScores = async (formId, scores) => {
  try {
    const response = await fetch('http://localhost:5000/api/evaluations/validate-scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ formId, scores })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur de validation des scores');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la validation des scores:', error);
    throw error;
  }
};
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
