<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <h2 class="text-h4">Formulaires d'évaluation</h2>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog">
            Créer un formulaire
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title>Liste des formulaires</v-card-title>
          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="search"
                  label="Rechercher un formulaire"
                  prepend-inner-icon="mdi-magnify"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="filterValidFrom"
                  label="Valide à partir de"
                  type="date"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="filterValidTo"
                  label="Valide jusqu'à"
                  type="date"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredForms"
              :items-per-page="10"
              class="elevation-1 rounded-lg"
              :loading="loading"
            >
              <template v-slot:item.associationType="{ item }">
                <v-chip 
                  :color="item.associationType === 'student' ? 'primary' : 'secondary'"
                  small
                >
                  {{ item.associationType === 'student' ? 'Étudiants' : 'Groupes' }}
                </v-chip>
              </template>
              
              <template v-slot:item.validFrom="{ item }">
                {{ formatDate(item.validFrom) }}
              </template>
              
              <template v-slot:item.validTo="{ item }">
                {{ formatDate(item.validTo) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon variant="text" color="primary" @click="editForm(item)" size="small">
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                </v-btn>
                <v-btn icon variant="text" color="success" @click="duplicateForm(item)" size="small">
                  <v-icon>mdi-content-copy</v-icon>
                  <v-tooltip activator="parent" location="top">Dupliquer</v-tooltip>
                </v-btn>
                <v-btn icon variant="text" color="error" @click="confirmDeleteForm(item)" size="small">
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top">Supprimer</v-tooltip>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de création/modification de formulaire -->
    <v-dialog v-model="dialog" max-width="1000px" persistent>
      <v-card>
        <v-card-title class="text-h5 primary text-white pa-4">
          <v-icon left color="white">mdi-file-document-outline</v-icon>
          {{ dialogTitle }}
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formIsValid">
            <v-row>
              <!-- Informations générales -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Informations générales</h3>
              </v-col>
              
              <v-col cols="12" md="8">
                <v-text-field 
                  v-model="form.title" 
                  label="Titre du formulaire" 
                  prepend-inner-icon="mdi-format-title"
                  variant="outlined"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.associationType"
                  :items="[
                    { title: 'Étudiants individuels', value: 'student' },
                    { title: 'Groupes d\'étudiants', value: 'group' }
                  ]"
                  label="Entité à Evaluer"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  :rules="[rules.required]"
                  @update:model-value="onAssociationTypeChange"
                />
              </v-col>

              <!-- Période de validité -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Période de validité</h3>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.validFrom"
                  label="Valide à partir de"
                  type="datetime-local"
                  prepend-inner-icon="mdi-calendar-start"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.validTo"
                  label="Valide jusqu'à"
                  type="datetime-local"
                  prepend-inner-icon="mdi-calendar-end"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Association aux étudiants (si type student) -->
              <v-col cols="12" v-if="form.associationType === 'student'">
                <h3 class="text-h6 mb-4">Association aux étudiants</h3>
                
                <v-row>
                  <!-- Étudiants disponibles -->
                  <v-col cols="12" md="5">
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1 pa-3">
                        Étudiants disponibles
                        <v-spacer></v-spacer>
                        <v-chip size="small">{{ availableStudents.length }}</v-chip>
                      </v-card-title>
                      
                      <v-card-text class="pa-2">
                        <!-- Filtres pour les étudiants disponibles -->
                        <v-row dense class="mb-2">
                          <v-col cols="6">
                            <v-select
                              v-model="studentFilters.year"
                              :items="['', 'BUT1', 'BUT2', 'BUT3']"
                              label="Année"
                              density="compact"
                              variant="outlined"
                              clearable
                              @update:model-value="filterAvailableStudents"
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-select
                              v-model="studentFilters.group"
                              :items="availableGroups"
                              label="Groupe"
                              density="compact"
                              variant="outlined"
                              clearable
                              @update:model-value="filterAvailableStudents"
                            />
                          </v-col>
                        </v-row>
                        
                        <v-text-field
                          v-model="studentFilters.search"
                          label="Rechercher un étudiant"
                          prepend-inner-icon="mdi-magnify"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="mb-2"
                          @input="filterAvailableStudents"
                        />
                        
                        <div class="student-list">
                          <v-list density="compact" max-height="300" style="overflow-y: auto;">
                            <v-list-item
                              v-for="student in filteredAvailableStudents"
                              :key="student._id"
                              @click="addStudentToForm(student)"
                              class="student-item"
                            >
                              <v-list-item-title class="text-body-2">
                                {{ student.firstName }} {{ student.lastName }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption">
                                {{ student.year }} - {{ student.group }}
                              </v-list-item-subtitle>
                              <template v-slot:append>
                                <v-btn icon size="small" variant="text" color="primary">
                                  <v-icon size="small">mdi-plus</v-icon>
                                </v-btn>
                              </template>
                            </v-list-item>
                          </v-list>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- Boutons de transfert -->
                  <v-col cols="12" md="2" class="d-flex flex-column justify-center align-center">
                    <v-btn
                      color="primary"
                      icon
                      class="mb-2"
                      @click="addAllStudents"
                      :disabled="filteredAvailableStudents.length === 0"
                    >
                      <v-icon>mdi-chevron-double-right</v-icon>
                    </v-btn>
                    <v-btn
                      color="secondary"
                      icon
                      @click="removeAllStudents"
                      :disabled="form.students.length === 0"
                    >
                      <v-icon>mdi-chevron-double-left</v-icon>
                    </v-btn>
                  </v-col>
                  
                  <!-- Étudiants sélectionnés -->
                  <v-col cols="12" md="5">
                    <v-card variant="outlined">
                      <v-card-title class="text-subtitle-1 pa-3">
                        Étudiants sélectionnés
                        <v-spacer></v-spacer>
                        <v-chip size="small" color="primary">{{ form.students.length }}</v-chip>
                      </v-card-title>
                      
                      <v-card-text class="pa-2">
                        <v-text-field
                          v-model="selectedStudentSearch"
                          label="Rechercher dans la sélection"
                          prepend-inner-icon="mdi-magnify"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="mb-2"
                        />
                        
                        <div class="student-list">
                          <v-list density="compact" max-height="300" style="overflow-y: auto;">
                            <v-list-item
                              v-for="student in filteredSelectedStudents"
                              :key="student._id"
                              @click="removeStudentFromForm(student)"
                              class="student-item"
                            >
                              <v-list-item-title class="text-body-2">
                                {{ student.firstName }} {{ student.lastName }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption">
                                {{ student.year }} - {{ student.group }}
                              </v-list-item-subtitle>
                              <template v-slot:append>
                                <v-btn icon size="small" variant="text" color="error">
                                  <v-icon size="small">mdi-minus</v-icon>
                                </v-btn>
                              </template>
                            </v-list-item>
                          </v-list>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Association aux groupes (si type group) -->
              <v-col cols="12" v-if="form.associationType === 'group'">
                <h3 class="text-h6 mb-4">Configuration des groupes</h3>
                <v-text-field
                  v-model.number="form.groupCount"
                  label="Nombre de groupes à évaluer"
                  type="number"
                  min="1"
                  max="50"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  :rules="[rules.required, rules.isNumber, rules.minGroups]"
                  hint="Spécifiez le nombre de groupes qui seront évalués avec ce formulaire"
                  persistent-hint
                />
              </v-col>

              <!-- Sections du formulaire -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4">Sections d'évaluation</h3>
                
                <v-expansion-panels v-model="expanded" multiple>
                  <v-expansion-panel
                    v-for="(section, sectionIndex) in form.sections"
                    :key="sectionIndex"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-folder-outline</v-icon>
                        {{ section.title || `Section ${sectionIndex + 1}` }}
                        <v-spacer></v-spacer>
                        <v-chip size="small" class="mr-2">{{ section.lines.length }} critères</v-chip>
                      </div>
                    </v-expansion-panel-title>
                    
                    <v-expansion-panel-text>
                      <v-card flat>
                        <v-card-text>
                          <v-row>
                            <v-col cols="12" md="8">
                              <v-text-field
                                v-model="section.title"
                                label="Titre de la section"
                                prepend-inner-icon="mdi-format-title"
                                variant="outlined"
                                :rules="[rules.required]"
                              />
                            </v-col>
                            <v-col cols="12" md="4" class="d-flex align-center">
                              <v-btn
                                color="success"
                                prepend-icon="mdi-plus"
                                @click="addLine(section)"
                                class="mr-2"
                              >
                                Ajouter un critère
                              </v-btn>
                              <v-btn
                                color="error"
                                icon
                                @click="removeSection(sectionIndex)"
                                :disabled="form.sections.length === 1"
                              >
                                <v-icon>mdi-delete</v-icon>
                              </v-btn>
                            </v-col>
                          </v-row>

                          <!-- Lignes de critères -->
                          <div v-if="section.lines.length > 0" class="mt-4">
                            <h4 class="text-subtitle-1 mb-3">Critères d'évaluation</h4>
                            <v-row
                              v-for="(line, lineIndex) in section.lines"
                              :key="lineIndex"
                              class="mb-3"
                            >
                              <v-col cols="12" md="6">
                                <v-text-field
                                  v-model="line.title"
                                  :label="`Critère ${lineIndex + 1}`"
                                  prepend-inner-icon="mdi-checkbox-marked-circle-outline"
                                  variant="outlined"
                                  :rules="[rules.required]"
                                />
                              </v-col>
                              <v-col cols="12" md="2">
                                <v-select
                                  v-model="line.type"
                                  :items="[
                                    { title: 'Oui/Non', value: 'binary' },
                                    { title: 'Échelle 0-8', value: 'scale' }
                                  ]"
                                  label="Type de notation"
                                  variant="outlined"
                                  :rules="[rules.required]"
                                  @update:model-value="updateMaxScore(line)"
                                />
                              </v-col>
                              <v-col cols="12" md="2">
                                <v-text-field
                                  v-model.number="line.maxScore"
                                  label="Score max"
                                  type="number"
                                  variant="outlined"
                                  :rules="[rules.required, rules.isNumber]"
                                  :readonly="line.type === 'binary'"
                                />
                              </v-col>
                              <v-col cols="12" md="2" class="d-flex align-center">
                                <v-btn
                                  color="error"
                                  icon
                                  @click="removeLine(section, lineIndex)"
                                  :disabled="section.lines.length === 1"
                                >
                                  <v-icon>mdi-delete</v-icon>
                                </v-btn>
                              </v-col>
                            </v-row>
                          </div>
                          
                          <v-alert
                            v-if="section.lines.length === 0"
                            type="info"
                            variant="tonal"
                            class="mt-4"
                          >
                            Cette section ne contient aucun critère. Ajoutez au moins un critère d'évaluation.
                          </v-alert>
                        </v-card-text>
                      </v-card>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-btn 
                  class="mt-4" 
                  color="primary" 
                  prepend-icon="mdi-plus"
                  @click="addSection"
                  variant="outlined"
                >
                  Ajouter une section
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="closeDialog"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            @click="submitForm"
            :loading="saving"
            :disabled="!formIsValid || !isFormComplete"
          >
            {{ form.id ? 'Modifier' : 'Créer' }} le formulaire
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce formulaire ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteForm">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
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

// State des formulaires
const forms = ref([]);
const filteredForms = ref([]);
const loading = ref(false);
const saving = ref(false);

// State du dialog
const dialog = ref(false);
const deleteDialog = ref(false);
const dialogTitle = ref('Créer un formulaire');
const expanded = ref([]);

// State des notifications
const snackbar = ref({ show: false, text: '', color: 'success' });

// State de recherche et filtres
const search = ref('');
const filterValidFrom = ref('');
const filterValidTo = ref('');

// State des étudiants
const allStudents = ref([]);
const availableStudents = ref([]);
const studentFilters = ref({
  year: '',
  group: '',
  search: ''
});
const selectedStudentSearch = ref('');

// State du formulaire
const formRef = ref(null);
const formIsValid = ref(false);
const formToDelete = ref(null);

const form = ref({
  id: null,
  title: '',
  associationType: '',
  students: [],
  groupCount: 0,
  sections: [],
  validFrom: '',
  validTo: '',
});

// Headers pour la table
const headers = [
  { title: 'Titre', key: 'title', sortable: true },
  { title: "Type d'association", key: 'associationType', sortable: true },
  { title: 'Valide à partir de', key: 'validFrom', sortable: true },
  { title: 'Valide jusqu\'à', key: 'validTo', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '150px' },
];

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  isNumber: v => !isNaN(parseFloat(v)) && isFinite(v) || 'Doit être un nombre',
  minGroups: v => v >= 1 || 'Au moins 1 groupe requis',
};

// Computed properties
const currentUser = computed(() => authService.getCurrentUser());

const availableGroups = computed(() => {
  const groups = [...new Set(allStudents.value.map(s => s.group))];
  return ['', ...groups.sort()];
});

const filteredAvailableStudents = computed(() => {
  return availableStudents.value.filter(student => {
    const matchesYear = !studentFilters.value.year || student.year === studentFilters.value.year;
    const matchesGroup = !studentFilters.value.group || student.group === studentFilters.value.group;
    const matchesSearch = !studentFilters.value.search || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentFilters.value.search.toLowerCase());
    return matchesYear && matchesGroup && matchesSearch;
  });
});

const filteredSelectedStudents = computed(() => {
  if (!selectedStudentSearch.value) return form.value.students;
  return form.value.students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(selectedStudentSearch.value.toLowerCase())
  );
});

const isFormComplete = computed(() => {
  if (!form.value.title || !form.value.associationType || !form.value.validFrom || !form.value.validTo) {
    return false;
  }
  
  if (form.value.associationType === 'student' && form.value.students.length === 0) {
    return false;
  }
  
  if (form.value.associationType === 'group' && form.value.groupCount < 1) {
    return false;
  }
  
  if (form.value.sections.length === 0) {
    return false;
  }
  
  return form.value.sections.every(section => 
    section.title && section.lines.length > 0 && 
    section.lines.every(line => line.title && line.type && line.maxScore)
  );
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

// Gestion des étudiants
const fetchStudents = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/students/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Erreur lors du chargement des étudiants');
    
    const data = await response.json();
    allStudents.value = data;
    updateAvailableStudents();
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
    showNotification('Erreur lors du chargement des étudiants', 'error');
  }
};

const updateAvailableStudents = () => {
  const selectedIds = form.value.students.map(s => s._id);
  availableStudents.value = allStudents.value.filter(s => !selectedIds.includes(s._id));
};

const filterAvailableStudents = () => {
  // La logique de filtrage est dans le computed filteredAvailableStudents
};

const addStudentToForm = (student) => {
  if (!form.value.students.find(s => s._id === student._id)) {
    form.value.students.push(student);
    updateAvailableStudents();
  }
};

const removeStudentFromForm = (student) => {
  const index = form.value.students.findIndex(s => s._id === student._id);
  if (index > -1) {
    form.value.students.splice(index, 1);
    updateAvailableStudents();
  }
};

const addAllStudents = () => {
  filteredAvailableStudents.value.forEach(student => {
    if (!form.value.students.find(s => s._id === student._id)) {
      form.value.students.push(student);
    }
  });
  updateAvailableStudents();
};

const removeAllStudents = () => {
  form.value.students = [];
  updateAvailableStudents();
};

// Gestion des sections et lignes
const addSection = () => {
  form.value.sections.push({ 
    title: '', 
    lines: [{ title: '', type: 'binary', maxScore: 1 }] 
  });
};

const removeSection = (index) => {
  if (form.value.sections.length > 1) {
    form.value.sections.splice(index, 1);
  }
};

const addLine = (section) => {
  section.lines.push({ title: '', type: 'binary', maxScore: 1 });
};

const removeLine = (section, lineIndex) => {
  if (section.lines.length > 1) {
    section.lines.splice(lineIndex, 1);
  }
};

const updateMaxScore = (line) => {
  if (line.type === 'binary') {
    line.maxScore = 1;
  } else if (line.type === 'scale') {
    line.maxScore = 8;
  }
};

// Gestion du type d'association
const onAssociationTypeChange = () => {
  if (form.value.associationType === 'student') {
    form.value.groupCount = 0;
    form.value.students = [];
    updateAvailableStudents();
  } else if (form.value.associationType === 'group') {
    form.value.students = [];
    form.value.groupCount = 1;
  }
};

// Gestion des formulaires
const fetchForms = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/forms/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Erreur lors du chargement des formulaires');
    
    const data = await response.json();
    forms.value = data;
    filteredForms.value = data;
  } catch (error) {
    console.error('Erreur lors du chargement des formulaires:', error);
    showNotification('Erreur lors du chargement des formulaires', 'error');
  } finally {
    loading.value = false;
  }
};

const filterForms = () => {
  filteredForms.value = forms.value.filter(form => {
    const matchesSearch = search.value === '' || 
      form.title.toLowerCase().includes(search.value.toLowerCase()) ||
      form.associationType.toLowerCase().includes(search.value.toLowerCase());

    const matchesValidFrom = filterValidFrom.value === '' || 
      new Date(form.validFrom) >= new Date(filterValidFrom.value);

    const matchesValidTo = filterValidTo.value === '' || 
      new Date(form.validTo) <= new Date(filterValidTo.value);

    return matchesSearch && matchesValidFrom && matchesValidTo;
  });
};

// Dialog management
const openDialog = () => {
  dialog.value = true;
  dialogTitle.value = 'Créer un formulaire';
  resetForm();
  fetchStudents();
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const resetForm = () => {
  form.value = {
    id: null,
    title: '',
    associationType: '',
    students: [],
    groupCount: 0,
    sections: [{ title: '', lines: [{ title: '', type: 'binary', maxScore: 1 }] }],
    validFrom: '',
    validTo: '',
  };
  expanded.value = [0];
  studentFilters.value = { year: '', group: '', search: '' };
  selectedStudentSearch.value = '';
  updateAvailableStudents();
};

const submitForm = async () => {
  if (!formIsValid.value || !isFormComplete.value) return;
  
  saving.value = true;
  try {
    const user = authService.getCurrentUser();
    const payload = {
      professor: user.id,
      title: form.value.title,
      associationType: form.value.associationType,
      students: form.value.students.map(s => s._id),
      groupCount: form.value.groupCount,
      sections: form.value.sections.map(section => ({
        title: section.title,
        lines: section.lines.map(line => ({
          title: line.title,
          maxScore: line.maxScore,
          type: line.type,
        })),
      })),
      validFrom: new Date(form.value.validFrom).toISOString(),
      validTo: new Date(form.value.validTo).toISOString(),
    };

    const url = form.value.id 
      ? `http://localhost:5000/api/forms/update/${form.value.id}` 
      : 'http://localhost:5000/api/forms/add';
    
    const method = form.value.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de ${form.value.id ? 'la modification' : 'la création'} du formulaire`);
    }

    showNotification(`Formulaire ${form.value.id ? 'modifié' : 'créé'} avec succès`, 'success');
    fetchForms();
    closeDialog();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du formulaire:', error);
    showNotification(error.message, 'error');
  } finally {
    saving.value = false;
  }
};

const editForm = async (formToEdit) => {
  await fetchStudents();
  dialog.value = true;
  dialogTitle.value = 'Modifier le formulaire';
  
  // Deep copy du formulaire
  form.value = {
    id: formToEdit._id,
    title: formToEdit.title,
    associationType: formToEdit.associationType,
    students: [], // Will be populated after fetching students
    groupCount: formToEdit.groupCount || 0,
    sections: JSON.parse(JSON.stringify(formToEdit.sections)),
    validFrom: formToEdit.validFrom ? new Date(formToEdit.validFrom).toISOString().slice(0, 16) : '',
    validTo: formToEdit.validTo ? new Date(formToEdit.validTo).toISOString().slice(0, 16) : '',
  };
  
  // Populate selected students
  if (formToEdit.students && formToEdit.students.length > 0) {
    form.value.students = allStudents.value.filter(student => 
      formToEdit.students.includes(student._id)
    );
  }
  
  updateAvailableStudents();
  expanded.value = form.value.sections.map((_, index) => index);
};

const duplicateForm = async (formToDuplicate) => {
  await fetchStudents();
  dialog.value = true;
  dialogTitle.value = 'Dupliquer le formulaire';
  
  form.value = {
    id: null,
    title: `${formToDuplicate.title} (Copie)`,
    associationType: formToDuplicate.associationType,
    students: [],
    groupCount: formToDuplicate.groupCount || 0,
    sections: JSON.parse(JSON.stringify(formToDuplicate.sections)),
    validFrom: '',
    validTo: '',
  };
  
  updateAvailableStudents();
  expanded.value = form.value.sections.map((_, index) => index);
};

const confirmDeleteForm = (formItem) => {
  formToDelete.value = formItem;
  deleteDialog.value = true;
};

const deleteForm = async () => {
  if (!formToDelete.value || !formToDelete.value._id) {
    showNotification('Erreur : Aucun formulaire valide à supprimer.', 'error');
    deleteDialog.value = false;
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/forms/delete/${formToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du formulaire');
    }

    showNotification('Formulaire supprimé avec succès', 'success');
    deleteDialog.value = false;
    fetchForms();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showNotification('Erreur lors de la suppression du formulaire', 'error');
  }
};

// Watchers
watch([search, filterValidFrom, filterValidTo], () => {
  filterForms();
});

watch(() => form.value.students, () => {
  updateAvailableStudents();
}, { deep: true });

// Lifecycle
onMounted(() => {
  fetchForms();
});
</script>

<style scoped>
.student-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.student-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.student-item:hover {
  background-color: #f0f0f0;
}

.v-expansion-panel-title {
  background-color: #f8f9fa;
}

.v-expansion-panel-text {
  background-color: #ffffff;
}

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

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-list-item-title {
  font-weight: 500;
}

.v-list-item-subtitle {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
  }
  
  .v-card-text {
    padding: 16px !important;
  }
}

.v-alert {
  border-radius: 8px;
}

.v-text-field, .v-select {
  margin-bottom: 8px;
}
</style>
