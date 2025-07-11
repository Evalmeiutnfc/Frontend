<template>
  <v-container fluid class="pa-4">
    <!-- En-tête amélioré -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-clipboard-text
              </v-icon>
              Gestion des formulaires
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Créez et gérez vos formulaires d'évaluation
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            @click="openDialog"
            prepend-icon="mdi-plus"
            variant="elevated"
            class="text-h6"
          >
            Créer un formulaire
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-text class="pa-6">
            <!-- Filtres et recherche -->
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="search"
                  label="Rechercher un formulaire"
                  placeholder="Titre, professeur..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="filterForms"
                  clearable
                >
                  <template v-slot:append-inner>
                    <v-fade-transition>
                      <v-icon v-if="search" size="small" color="primary">
                        mdi-clipboard-search
                      </v-icon>
                    </v-fade-transition>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedAssociationType"
                  :items="associationTypeOptions"
                  label="Type d'association"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-account-group"
                  @update:model-value="filterForms"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedStatus"
                  :items="statusOptions"
                  label="Statut"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-calendar-check"
                  @update:model-value="filterForms"
                  clearable
                ></v-select>
              </v-col>
            </v-row>

            <!-- Tableau des formulaires -->
            <v-data-table
              :headers="headers"
              :items="filteredForms"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des formulaires..."
              no-data-text="Aucun formulaire trouvé"
              items-per-page-text="Formulaires par page"
              @update:options="handleTableOptions"
            >
              <!-- Titre avec statut -->
              <template v-slot:item.title="{ item }">
                <div class="d-flex align-center">
                  <v-avatar 
                    :color="getStatusColor(item)" 
                    size="32" 
                    class="mr-3"
                  >
                    <v-icon color="white">{{ getStatusIcon(item) }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.title }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getSectionsCount(item) }} {{ getSectionsCount(item) > 1 ? 'sections' : 'section' }}
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

              <!-- Type d'association -->
              <template v-slot:item.associationType="{ item }">
                <v-chip
                  :color="item.associationType === 'student' ? 'green' : 'blue'"
                  :prepend-icon="item.associationType === 'student' ? 'mdi-account' : 'mdi-account-group'"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  {{ item.associationType === 'student' ? 'Étudiants' : 'Groupes' }}
                </v-chip>
              </template>

              <!-- Cibles -->
              <template v-slot:item.targets="{ item }">
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-if="item.students && item.students.length > 0"
                    color="green"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-account"
                  >
                    {{ item.students.length }} étudiant{{ item.students.length > 1 ? 's' : '' }}
                  </v-chip>
                  <v-chip
                    v-if="item.groups && item.groups.length > 0"
                    color="blue"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-account-group"
                  >
                    {{ item.groups.length }} groupe{{ item.groups.length > 1 ? 's' : '' }}
                  </v-chip>
                </div>
              </template>

              <!-- Période de validité -->
              <template v-slot:item.validity="{ item }">
                <div class="text-caption">
                  <div class="d-flex align-center mb-1">
                    <v-icon size="small" color="success" class="mr-1">mdi-calendar-start</v-icon>
                    <span>{{ formatDate(item.validFrom) }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="error" class="mr-1">mdi-calendar-end</v-icon>
                    <span>{{ formatDate(item.validTo) }}</span>
                  </div>
                </div>
              </template>

              <!-- Statut -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item)"
                  size="small"
                  variant="flat"
                  :prepend-icon="getStatusIcon(item)"
                >
                  {{ getStatusText(item) }}
                </v-chip>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn 
                    icon="mdi-eye" 
                    variant="text" 
                    color="info" 
                    size="small"
                    @click="viewForm(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les détails</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    color="primary" 
                    size="small"
                    @click="editForm(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-content-copy" 
                    variant="text" 
                    color="warning" 
                    size="small"
                    @click="duplicateForm(item)"
                  >
                    <v-icon size="small">mdi-content-copy</v-icon>
                    <v-tooltip activator="parent" location="top">Dupliquer</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-download" 
                    variant="text" 
                    color="success" 
                    size="small"
                    @click="exportForm(item)"
                  >
                    <v-icon size="small">mdi-download</v-icon>
                    <v-tooltip activator="parent" location="top">Exporter</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    color="error" 
                    size="small"
                    @click="confirmDeleteForm(item)"
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

    <!-- Dialog de création/modification de formulaire -->
    <v-dialog v-model="dialog" max-width="1200px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ isEditing ? 'mdi-clipboard-edit' : 'mdi-clipboard-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ isEditing ? 'Modifier le formulaire' : 'Créer un formulaire' }}
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ isEditing ? 'Modifiez les paramètres du formulaire' : 'Configurez votre nouveau formulaire d\'évaluation' }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formIsValid">
            <v-row>
              <!-- Informations générales -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                  Informations générales
                </h4>
              </v-col>
              
              <v-col cols="12" md="8">
                <v-text-field 
                  v-model="form.title" 
                  label="Titre du formulaire" 
                  prepend-inner-icon="mdi-format-title"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                  placeholder="Ex: Évaluation projet BUT3"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.professor"
                  :items="professors"
                  label="Professeur responsable"
                  prepend-inner-icon="mdi-account-tie"
                  variant="outlined"
                  density="comfortable"
                  item-title="fullName"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                />
              </v-col>

              <!-- Type d'association -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                  Type d'évaluation
                </h4>
              </v-col>
              
              <v-col cols="12">
                <v-radio-group
                  v-model="form.associationType"
                  inline
                  @update:model-value="onAssociationTypeChange"
                >
                  <v-radio
                    label="Évaluation individuelle"
                    value="student"
                    color="primary"
                  >
                    <template v-slot:label>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-account</v-icon>
                        <span>Évaluation individuelle</span>
                      </div>
                    </template>
                  </v-radio>
                  <v-radio
                    label="Évaluation par groupe"
                    value="group"
                    color="primary"
                  >
                    <template v-slot:label>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-account-group</v-icon>
                        <span>Évaluation par groupe</span>
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-col>

              <!-- Période de validité -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-calendar-range</v-icon>
                  Période de validité
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.validFrom"
                  label="Valide à partir de"
                  type="datetime-local"
                  prepend-inner-icon="mdi-calendar-start"
                  variant="outlined"
                  density="comfortable"
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
                  density="comfortable"
                  :rules="[rules.required, rules.validToAfterFrom]"
                />
              </v-col>

              <!-- Association aux étudiants -->
              <v-col cols="12" v-if="form.associationType === 'student'">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account-multiple</v-icon>
                  Sélection des étudiants
                </h4>
                
                <v-select
                  v-model="form.students"
                  :items="availableStudents"
                  label="Étudiants à évaluer"
                  prepend-inner-icon="mdi-account-multiple"
                  variant="outlined"
                  density="comfortable"
                  item-title="fullName"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                  :rules="[rules.required, rules.minStudents]"
                  hint="Sélectionnez les étudiants qui seront évalués"
                  persistent-hint
                >
                  <template v-slot:selection="{ item, index }">
                    <v-chip
                      v-if="index < 3"
                      :key="item.raw._id"
                      size="small"
                      closable
                      @click:close="removeStudent(item.raw._id)"
                    >
                      {{ item.raw.firstName }} {{ item.raw.lastName }}
                    </v-chip>
                    <span
                      v-if="index === 3"
                      class="text-grey text-caption align-self-center"
                    >
                      (+{{ form.students.length - 3 }} autres)
                    </span>
                  </template>
                </v-select>
              </v-col>

              <!-- Association aux groupes -->
              <v-col cols="12" v-if="form.associationType === 'group'">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                  Sélection des groupes
                </h4>
                
                <v-select
                  v-model="form.groups"
                  :items="availableGroups"
                  label="Groupes à évaluer"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                  :rules="[rules.required, rules.minGroups]"
                  hint="Sélectionnez les groupes qui seront évalués"
                  persistent-hint
                >
                  <template v-slot:selection="{ item, index }">
                    <v-chip
                      v-if="index < 3"
                      :key="item.raw._id"
                      size="small"
                      closable
                      @click:close="removeGroup(item.raw._id)"
                    >
                      {{ item.raw.name }}
                    </v-chip>
                    <span
                      v-if="index === 3"
                      class="text-grey text-caption align-self-center"
                    >
                      (+{{ form.groups.length - 3 }} autres)
                    </span>
                  </template>
                </v-select>
              </v-col>

              <!-- Sections du formulaire -->
              <v-col cols="12">
                <div class="d-flex align-center justify-space-between mb-3">
                  <h4 class="text-h6 font-weight-medium">
                    <v-icon color="primary" class="mr-2">mdi-view-list</v-icon>
                    Sections d'évaluation
                  </h4>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    @click="addSection"
                    prepend-icon="mdi-plus"
                  >
                    Ajouter une section
                  </v-btn>
                </div>
                
                <v-expansion-panels v-model="expanded" multiple variant="accordion">
                  <v-expansion-panel
                    v-for="(section, sectionIndex) in form.sections"
                    :key="sectionIndex"
                    class="mb-2"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center w-100">
                        <v-icon class="mr-3">mdi-folder-outline</v-icon>
                        <div class="flex-grow-1">
                          <div class="font-weight-medium">{{ section.title || `Section ${sectionIndex + 1}` }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ section.lines.length }} critère{{ section.lines.length > 1 ? 's' : '' }}
                          </div>
                        </div>
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          color="error"
                          size="small"
                          @click.stop="removeSection(sectionIndex)"
                        >
                          <v-icon size="small">mdi-delete</v-icon>
                          <v-tooltip activator="parent" location="top">Supprimer la section</v-tooltip>
                        </v-btn>
                      </div>
                    </v-expansion-panel-title>
                    
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="section.title"
                            label="Titre de la section"
                            prepend-inner-icon="mdi-format-title"
                            variant="outlined"
                            density="comfortable"
                            :rules="[rules.required]"
                            placeholder="Ex: Qualité du code"
                          />
                        </v-col>
                        
                        <!-- Lignes de la section -->
                        <v-col cols="12">
                          <div class="d-flex align-center justify-space-between mb-3">
                            <h5 class="text-subtitle-1 font-weight-medium">Critères d'évaluation</h5>
                            <v-btn
                              color="secondary"
                              variant="outlined"
                              size="small"
                              @click="addLine(sectionIndex)"
                              prepend-icon="mdi-plus"
                            >
                              Ajouter un critère
                            </v-btn>
                          </div>
                          
                          <v-card
                            v-for="(line, lineIndex) in section.lines"
                            :key="lineIndex"
                            class="mb-3"
                            variant="outlined"
                          >
                            <v-card-text class="pa-4">
                              <v-row>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model="line.title"
                                    label="Titre du critère"
                                    prepend-inner-icon="mdi-star"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[rules.required]"
                                    placeholder="Ex: Lisibilité du code"
                                  />
                                </v-col>
                                
                                <v-col cols="12" md="3">
                                  <v-select
                                    v-model="line.type"
                                    :items="lineTypes"
                                    label="Type d'évaluation"
                                    prepend-inner-icon="mdi-format-list-bulleted"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[rules.required]"
                                    @update:model-value="onLineTypeChange(line)"
                                  />
                                </v-col>
                                
                                <v-col cols="12" md="2">
                                  <v-text-field
                                    v-model.number="line.maxScore"
                                    label="Score max"
                                    prepend-inner-icon="mdi-numeric"
                                    variant="outlined"
                                    density="comfortable"
                                    type="number"
                                    :min="line.type === 'binary' ? 1 : 0"
                                    :max="line.type === 'scale' ? 8 : 100"
                                    :rules="[rules.required, rules.isNumber, ...getScoreRules(line.type)]"
                                    :readonly="line.type === 'binary'"
                                  />
                                </v-col>
                                
                                <v-col cols="12" md="1">
                                  <v-btn
                                    icon="mdi-delete"
                                    variant="text"
                                    color="error"
                                    @click="removeLine(sectionIndex, lineIndex)"
                                  >
                                    <v-icon>mdi-delete</v-icon>
                                    <v-tooltip activator="parent" location="top">Supprimer le critère</v-tooltip>
                                  </v-btn>
                                </v-col>
                                
                                <v-col cols="12">
                                  <v-select
                                    v-model="line.notationType"
                                    :items="notationTypes"
                                    label="Type de notation"
                                    prepend-inner-icon="mdi-account-group"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[rules.required]"
                                    hint="Définit comment les notes seront attribuées"
                                    persistent-hint
                                  />
                                </v-col>
                              </v-row>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="closeDialog"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            @click="saveForm" 
            :disabled="!formIsValid"
            :loading="saving"
            prepend-icon="mdi-check"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
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
import { ref, onMounted, computed } from 'vue';

// État de la page
const loading = ref(false);
const saving = ref(false);
const forms = ref([]);
const filteredForms = ref([]);
const search = ref('');
const selectedAssociationType = ref(null);
const selectedStatus = ref(null);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Options pour les filtres
const associationTypeOptions = ref([
  { title: 'Étudiants', value: 'student' },
  { title: 'Groupes', value: 'group' }
]);

const statusOptions = ref([
  { title: 'Actif', value: 'active' },
  { title: 'Expiré', value: 'expired' },
  { title: 'À venir', value: 'upcoming' }
]);

// Données pour les formulaires
const professors = ref([]);
const availableStudents = ref([]);
const availableGroups = ref([]);

// État du dialogue
const dialog = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const formIsValid = ref(false);
const expanded = ref([]);

// Modèle de formulaire
const form = ref({
  title: '',
  professor: '',
  associationType: 'student',
  students: [],
  groups: [],
  sections: [],
  validFrom: '',
  validTo: ''
});

// Types de lignes et notations
const lineTypes = ref([
  { title: 'Binaire (Oui/Non)', value: 'binary' },
  { title: 'Échelle (0-8)', value: 'scale' }
]);

const notationTypes = ref([
  { title: 'Commune', value: 'common' },
  { title: 'Individuelle', value: 'individual' },
  { title: 'Mixte', value: 'mixed' }
]);

// En-têtes du tableau
const headers = ref([
  { title: 'Formulaire', align: 'start', key: 'title', sortable: false },
  { title: 'Professeur', align: 'start', key: 'professor' },
  { title: 'Type', align: 'start', key: 'associationType' },
  { title: 'Cibles', align: 'start', key: 'targets' },
  { title: 'Validité', align: 'start', key: 'validity' },
  { title: 'Statut', align: 'start', key: 'status' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Dialogue de suppression
const deleteDialog = ref(false);
const formToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  isNumber: v => !isNaN(parseFloat(v)) && isFinite(v) || 'Doit être un nombre',
  minStudents: v => v.length >= 1 || 'Au moins un étudiant requis',
  minGroups: v => v.length >= 1 || 'Au moins un groupe requis',
  validToAfterFrom: v => {
    if (!form.value.validFrom || !v) return true;
    return new Date(v) > new Date(form.value.validFrom) || 'La date de fin doit être postérieure à la date de début';
  }
};

// Chargement des données au montage
onMounted(async () => {
  await loadProfessors();
  await loadStudents();
  await loadGroups();
  await loadForms();
});

// Méthodes utilitaires
const getSectionsCount = (item) => {
  return item.sections?.length || 0;
};

const getStatusColor = (item) => {
  const now = new Date();
  const validFrom = new Date(item.validFrom);
  const validTo = new Date(item.validTo);
  
  if (now < validFrom) return 'warning';
  if (now > validTo) return 'error';
  return 'success';
};

const getStatusIcon = (item) => {
  const now = new Date();
  const validFrom = new Date(item.validFrom);
  const validTo = new Date(item.validTo);
  
  if (now < validFrom) return 'mdi-clock-outline';
  if (now > validTo) return 'mdi-clock-alert';
  return 'mdi-check-circle';
};

const getStatusText = (item) => {
  const now = new Date();
  const validFrom = new Date(item.validFrom);
  const validTo = new Date(item.validTo);
  
  if (now < validFrom) return 'À venir';
  if (now > validTo) return 'Expiré';
  return 'Actif';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getScoreRules = (type) => {
  if (type === 'binary') {
    return [v => v === 1 || 'Le score pour un type binaire doit être 1'];
  } else if (type === 'scale') {
    return [
      v => v >= 0 || 'Le score minimum est 0',
      v => v <= 8 || 'Le score maximum est 8'
    ];
  }
  return [];
};

// Méthodes de chargement des données
const loadProfessors = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/users?role=professor', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      professors.value = (data.users || data || []).map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des professeurs:', error);
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

const loadForms = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.value.page);
    queryParams.append('limit', pagination.value.limit);
    
    if (selectedAssociationType.value) {
      queryParams.append('associationType', selectedAssociationType.value);
    }

    const response = await fetch(`http://localhost:5000/api/forms?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des formulaires');
    }

    const data = await response.json();
    forms.value = data.forms || [];
    filteredForms.value = forms.value;
    
    if (data.pagination) {
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des formulaires',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadForms();
};

const filterForms = () => {
  filteredForms.value = forms.value.filter(form => {
    const matchesSearch = search.value === '' || 
      form.title?.toLowerCase().includes(search.value.toLowerCase()) ||
      form.professor?.firstName?.toLowerCase().includes(search.value.toLowerCase()) ||
      form.professor?.lastName?.toLowerCase().includes(search.value.toLowerCase());
      
    const matchesAssociationType = selectedAssociationType.value === null || 
      form.associationType === selectedAssociationType.value;
      
    const matchesStatus = selectedStatus.value === null || 
      getStatusText(form).toLowerCase() === selectedStatus.value.replace('active', 'actif').replace('expired', 'expiré').replace('upcoming', 'à venir');
      
    return matchesSearch && matchesAssociationType && matchesStatus;
  });
};

// Méthodes du dialogue
const openDialog = () => {
  resetForm();
  isEditing.value = false;
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const resetForm = () => {
  form.value = {
    title: '',
    professor: '',
    associationType: 'student',
    students: [],
    groups: [],
    sections: [],
    validFrom: '',
    validTo: ''
  };
  expanded.value = [];
  isEditing.value = false;
};

const onAssociationTypeChange = () => {
  form.value.students = [];
  form.value.groups = [];
};

const onLineTypeChange = (line) => {
  if (line.type === 'binary') {
    line.maxScore = 1;
  } else if (line.type === 'scale') {
    line.maxScore = 8;
  }
};

const removeStudent = (studentId) => {
  form.value.students = form.value.students.filter(id => id !== studentId);
};

const removeGroup = (groupId) => {
  form.value.groups = form.value.groups.filter(id => id !== groupId);
};

// Méthodes de gestion des sections
const addSection = () => {
  form.value.sections.push({
    title: '',
    lines: []
  });
  expanded.value.push(form.value.sections.length - 1);
};

const removeSection = (sectionIndex) => {
  form.value.sections.splice(sectionIndex, 1);
  expanded.value = expanded.value.filter(i => i !== sectionIndex).map(i => i > sectionIndex ? i - 1 : i);
};

const addLine = (sectionIndex) => {
  form.value.sections[sectionIndex].lines.push({
    title: '',
    maxScore: 1,
    type: 'binary',
    notationType: 'common'
  });
};

const removeLine = (sectionIndex, lineIndex) => {
  form.value.sections[sectionIndex].lines.splice(lineIndex, 1);
};

// Méthodes CRUD
const saveForm = async () => {
  if (!formRef.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/forms/update/${form.value._id}`
      : 'http://localhost:5000/api/forms/add';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form.value)
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du formulaire`);
    }

    snackbar.value = {
      show: true,
      text: `Formulaire ${isEditing.value ? 'modifié' : 'créé'} avec succès`,
      color: 'success'
    };

    closeDialog();
    await loadForms();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du formulaire`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const viewForm = (item) => {
  console.log('Voir formulaire:', item);
  // Implémenter la vue détaillée si nécessaire
};

const editForm = (item) => {
  isEditing.value = true;
  form.value = { ...item };
  
  // Convertir les dates au format datetime-local
  if (form.value.validFrom) {
    form.value.validFrom = new Date(form.value.validFrom).toISOString().slice(0, 16);
  }
  if (form.value.validTo) {
    form.value.validTo = new Date(form.value.validTo).toISOString().slice(0, 16);
  }
  
  dialog.value = true;
};

const duplicateForm = async (item) => {
  const duplicatedForm = {
    ...item,
    title: `${item.title} (copie)`,
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  };
  
  delete duplicatedForm._id;
  delete duplicatedForm.createdAt;
  delete duplicatedForm.updatedAt;
  
  form.value = duplicatedForm;
  isEditing.value = false;
  dialog.value = true;
};

const exportForm = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/forms/${item._id}/export`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
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

const confirmDeleteForm = (item) => {
  formToDelete.value = item;
  deleteDialog.value = true;
};

const deleteForm = async () => {
  if (!formToDelete.value) return;

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

    snackbar.value = {
      show: true,
      text: 'Formulaire supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    await loadForms();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression du formulaire',
      color: 'error'
    };
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