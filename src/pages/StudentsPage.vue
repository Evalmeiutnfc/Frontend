<template>
  <v-container fluid class="pa-4">
    <!-- En-tête amélioré -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-school
              </v-icon>
              Gestion des étudiants
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Administrez les étudiants et leurs affectations
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            @click="openAddStudentDialog"
            prepend-icon="mdi-plus"
            variant="elevated"
            class="text-h6"
          >
            Ajouter un étudiant
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
                  label="Rechercher un étudiant"
                  placeholder="Nom, prénom, numéro étudiant..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="filterStudents"
                  clearable
                >
                  <template v-slot:append-inner>
                    <v-fade-transition>
                      <v-icon v-if="search" size="small" color="primary">
                        mdi-school-search
                      </v-icon>
                    </v-fade-transition>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedYear"
                  :items="yearOptions"
                  label="Filtrer par année"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-calendar"
                  @update:model-value="filterStudents"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedPromotion"
                  :items="promotionOptions"
                  label="Filtrer par promotion"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-school"
                  @update:model-value="filterStudents"
                  clearable
                ></v-select>
              </v-col>
            </v-row>

            <!-- Table des étudiants -->
            <v-data-table
              :headers="headers"
              :items="filteredStudents"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des étudiants..."
              no-data-text="Aucun étudiant trouvé"
              items-per-page-text="Étudiants par page"
              @update:options="handleTableOptions"
            >
              <!-- Nom complet avec avatar -->
              <template v-slot:item.fullName="{ item }">
                <div class="d-flex align-center">
                  <v-avatar 
                    :color="getStudentColor(item.isGroup)" 
                    size="32" 
                    class="mr-3"
                  >
                    <v-icon color="white">{{ getStudentIcon(item.isGroup) }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.year }}</div>
                  </div>
                </div>
              </template>

              <!-- Numéro étudiant -->
              <template v-slot:item.studentNumber="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-card-account-details</v-icon>
                  <span>{{ item.studentNumber }}</span>
                </div>
              </template>

              <!-- Année avec chip -->
              <template v-slot:item.year="{ item }">
                <v-chip
                  :color="getYearColor(item.year)"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  {{ item.year }}
                </v-chip>
              </template>

              <!-- Promotion actuelle -->
              <template v-slot:item.currentPromotion="{ item }">
                <v-chip
                  v-if="item.currentPromotion?.name"
                  color="primary"
                  size="small"
                  variant="flat"
                  prepend-icon="mdi-school"
                  class="font-weight-medium"
                >
                  {{ item.currentPromotion.name }}
                </v-chip>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Groupe actuel -->
              <template v-slot:item.currentGroup="{ item }">
                <v-chip
                  v-if="item.currentGroup?.name"
                  color="success"
                  size="small"
                  variant="flat"
                  prepend-icon="mdi-account-group"
                  class="font-weight-medium"
                >
                  {{ item.currentGroup.name }}
                </v-chip>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Promotions -->
              <template v-slot:item.promotions="{ item }">
                <div v-if="item.promotions && item.promotions.length > 0">
                  <v-chip
                    v-for="promotion in item.promotions.slice(0, 2)"
                    :key="promotion._id || promotion"
                    color="secondary"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-school"
                    class="mr-1 mb-1"
                  >
                    {{ promotion.name || promotion }}
                  </v-chip>
                  <v-chip
                    v-if="item.promotions.length > 2"
                    color="grey"
                    size="small"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >
                    +{{ item.promotions.length - 2 }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Groupes -->
              <template v-slot:item.groups="{ item }">
                <div v-if="item.groups && item.groups.length > 0">
                  <v-chip
                    v-for="group in item.groups.slice(0, 2)"
                    :key="group._id || group"
                    color="info"
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-account-group"
                    class="mr-1 mb-1"
                  >
                    {{ group.name || group }}
                  </v-chip>
                  <v-chip
                    v-if="item.groups.length > 2"
                    color="grey"
                    size="small"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >
                    +{{ item.groups.length - 2 }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn 
                    icon="mdi-eye" 
                    variant="text" 
                    color="info" 
                    size="small"
                    @click="viewStudentContext(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir le contexte</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    color="primary" 
                    size="small"
                    @click="editStudent(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    color="error" 
                    size="small"
                    @click="confirmDelete(item)"
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

    <!-- Dialog d'ajout/modification d'étudiant -->
    <v-dialog v-model="dialogOpen" max-width="800px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ isEditing ? 'mdi-account-edit' : 'mdi-account-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ isEditing ? 'Modifier l\'étudiant' : 'Ajouter un étudiant' }}
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ isEditing ? 'Modifiez les informations de l\'étudiant' : 'Créez un nouvel étudiant' }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="form" v-model="formValid">
            <v-row>
              <!-- Informations personnelles -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account</v-icon>
                  Informations personnelles
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.firstName"
                  label="Prénom"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  required
                  :rules="[v => !!v || 'Le prénom est requis']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.lastName"
                  label="Nom"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  required
                  :rules="[v => !!v || 'Le nom est requis']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.studentNumber"
                  label="Numéro étudiant"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-card-account-details"
                  required
                  :rules="[v => !!v || 'Le numéro étudiant est requis']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.year"
                  :items="yearOptions"
                  label="Année"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                  required
                  :rules="[v => !!v || 'L\'année est requise']"
                ></v-select>
              </v-col>

              <!-- Affectations -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-school</v-icon>
                  Affectations actuelles
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.currentPromotion"
                  :items="promotionOptions"
                  label="Promotion actuelle"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-school"
                  item-title="name"
                  item-value="_id"
                  placeholder="Sélectionnez la promotion actuelle"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.currentGroup"
                  :items="groupOptions"
                  label="Groupe actuel"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-group"
                  item-title="name"
                  item-value="_id"
                  placeholder="Sélectionnez le groupe actuel"
                ></v-select>
              </v-col>

              <!-- Historique des affectations -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3 mt-4">
                  <v-icon color="secondary" class="mr-2">mdi-history</v-icon>
                  Historique des affectations
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.promotions"
                  :items="promotionOptions"
                  label="Toutes les promotions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-school"
                  item-title="name"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                  placeholder="Sélectionnez toutes les promotions"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.groups"
                  :items="groupOptions"
                  label="Tous les groupes"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-group"
                  item-title="name"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                  placeholder="Sélectionnez tous les groupes"
                ></v-select>
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
            @click="dialogOpen = false"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            @click="saveStudent" 
            :disabled="!formValid"
            :loading="saving"
            prepend-icon="mdi-check"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteStudent">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de contexte hiérarchique -->
    <v-dialog v-model="contextDialog" max-width="800px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">mdi-account-tree</v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                Contexte hiérarchique
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedStudentContext?.student?.firstName }} {{ selectedStudentContext?.student?.lastName }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <div v-if="selectedStudentContext">
            <!-- Informations de base -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account</v-icon>
                  Informations générales
                </h4>
                <v-chip color="primary" class="mr-2">{{ selectedStudentContext.student.studentNumber }}</v-chip>
                <v-chip color="secondary">{{ selectedStudentContext.student.year }}</v-chip>
              </v-col>
            </v-row>

            <!-- Affectations actuelles -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="success" class="mr-2">mdi-star</v-icon>
                  Affectations actuelles
                </h4>
                <div class="d-flex gap-2 mb-3">
                  <v-chip
                    v-if="selectedStudentContext.student.currentPromotion"
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-school"
                  >
                    {{ selectedStudentContext.student.currentPromotion.name }}
                  </v-chip>
                  <v-chip
                    v-if="selectedStudentContext.student.currentGroup"
                    color="success"
                    variant="flat"
                    prepend-icon="mdi-account-group"
                  >
                    {{ selectedStudentContext.student.currentGroup.name }}
                  </v-chip>
                </div>
                <v-alert v-if="!selectedStudentContext.student.currentPromotion && !selectedStudentContext.student.currentGroup" type="warning" variant="tonal" class="mb-0">
                  Aucune affectation actuelle définie
                </v-alert>
              </v-col>
            </v-row>

            <!-- Promotions -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-school</v-icon>
                  Historique des promotions ({{ selectedStudentContext.hierarchy.promotions?.length || 0 }})
                </h4>
                <div v-if="selectedStudentContext.hierarchy.promotions?.length > 0">
                  <v-chip
                    v-for="promotion in selectedStudentContext.hierarchy.promotions"
                    :key="promotion._id"
                    color="secondary"
                    variant="outlined"
                    class="mr-2 mb-2"
                  >
                    {{ promotion.name }} ({{ promotion.year }})
                  </v-chip>
                </div>
                <v-alert v-else type="info" variant="tonal" class="mb-0">
                  Aucune promotion dans l'historique
                </v-alert>
              </v-col>
            </v-row>

            <!-- Groupes -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                  Historique des groupes ({{ selectedStudentContext.hierarchy.groups?.length || 0 }})
                </h4>
                <div v-if="selectedStudentContext.hierarchy.groups?.length > 0">
                  <v-chip
                    v-for="group in selectedStudentContext.hierarchy.groups"
                    :key="group._id"
                    color="info"
                    variant="outlined"
                    class="mr-2 mb-2"
                  >
                    {{ group.name }} ({{ group.year }})
                  </v-chip>
                </div>
                <v-alert v-else type="info" variant="tonal" class="mb-0">
                  Aucun groupe dans l'historique
                </v-alert>
              </v-col>
            </v-row>

            <!-- Sous-groupes -->
            <v-row>
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-account-multiple</v-icon>
                  Sous-groupes ({{ selectedStudentContext.hierarchy.subgroups?.length || 0 }})
                </h4>
                <div v-if="selectedStudentContext.hierarchy.subgroups?.length > 0">
                  <v-list>
                    <v-list-item
                      v-for="subgroup in selectedStudentContext.hierarchy.subgroups"
                      :key="subgroup.name"
                      class="border rounded mb-2"
                    >
                      <template v-slot:prepend>
                        <v-icon color="warning">mdi-account-multiple</v-icon>
                      </template>
                      <v-list-item-title>{{ subgroup.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        Groupe: {{ subgroup.groupName }} - {{ subgroup.studentsCount }} étudiant(s)
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
                <v-alert v-else type="info" variant="tonal" class="mb-0">
                  Aucun sous-groupe assigné
                </v-alert>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="contextDialog = false"
            prepend-icon="mdi-close"
          >
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de notification -->
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
const students = ref([]);
const filteredStudents = ref([]);
const search = ref('');
const selectedYear = ref(null);
const selectedPromotion = ref(null);
const selectedGroup = ref(null);

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
const yearOptions = ref([
  { title: 'BUT1', value: 'BUT1' },
  { title: 'BUT2', value: 'BUT2' },
  { title: 'BUT3', value: 'BUT3' }
]);

const promotionOptions = ref([]);
const groupOptions = ref([]);

// Modèle étudiant avec multi-appartenance
const student = ref({
  firstName: '',
  lastName: '',
  year: '',
  promotions: [],
  groups: [],
  studentNumber: '',
  currentPromotion: '',
  currentGroup: '',
  history: []
});

// En-têtes du tableau mis à jour
const headers = ref([
  { title: 'Étudiant', align: 'start', key: 'fullName', sortable: false },
  { title: 'Numéro étudiant', align: 'start', key: 'studentNumber' },
  { title: 'Année', align: 'start', key: 'year' },
  { title: 'Promotion actuelle', align: 'start', key: 'currentPromotion' },
  { title: 'Groupe actuel', align: 'start', key: 'currentGroup' },
  { title: 'Promotions', align: 'start', key: 'promotions' },
  { title: 'Groupes', align: 'start', key: 'groups' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Formulaire et dialogue
const dialogOpen = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const deleteDialog = ref(false);
const studentToDelete = ref(null);
const contextDialog = ref(false);
const selectedStudentContext = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Chargement des données au montage du composant
onMounted(async () => {
  await loadPromotions();
  await loadGroups();
  await loadStudents();
});

// Méthodes utilitaires
const getStudentColor = (isGroup) => {
  return isGroup ? 'purple' : 'green';
};

const getStudentIcon = (isGroup) => {
  return isGroup ? 'mdi-account-group' : 'mdi-school';
};

const getYearColor = (year) => {
  switch (year) {
    case 'BUT1': return 'green';
    case 'BUT2': return 'orange';
    case 'BUT3': return 'red';
    default: return 'grey';
  }
};

// Méthodes
const loadStudents = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.value.page);
    queryParams.append('limit', pagination.value.limit);
    
    if (selectedYear.value) queryParams.append('year', selectedYear.value);
    if (selectedPromotion.value) queryParams.append('promotion', selectedPromotion.value);
    if (selectedGroup.value) queryParams.append('group', selectedGroup.value);

    const response = await fetch(`http://localhost:5000/api/students/list?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des étudiants');
    }

    const data = await response.json();
    students.value = data.students || [];
    filteredStudents.value = students.value;
    
    // Mettre à jour la pagination
    if (data.pagination) {
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des étudiants',
      color: 'error'
    };
  } finally {
    loading.value = false;
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
      promotionOptions.value = data.promotions || data || [];
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
      groupOptions.value = data.groups || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des groupes:', error);
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadStudents();
};

const filterStudents = () => {
  filteredStudents.value = students.value.filter(student => {
    const matchesSearch = search.value === '' || 
      student.firstName?.toLowerCase().includes(search.value.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(search.value.toLowerCase()) ||
      student.studentNumber?.toLowerCase().includes(search.value.toLowerCase());
      
    const matchesYear = selectedYear.value === null || 
      student.year === selectedYear.value;
      
    const matchesPromotion = selectedPromotion.value === null || 
      (student.promotions && student.promotions.some(p => 
        (p._id || p) === selectedPromotion.value
      ));
      
    return matchesSearch && matchesYear && matchesPromotion;
  });
};

const viewStudentContext = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/students/${item._id}/context`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du contexte');
    }

    const data = await response.json();
    // Ajouter les informations des affectations actuelles
    const studentWithCurrent = await fetch(`http://localhost:5000/api/students/list?_id=${item._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (studentWithCurrent.ok) {
      const studentData = await studentWithCurrent.json();
      const fullStudent = studentData.students?.[0];
      if (fullStudent) {
        data.student.currentPromotion = fullStudent.currentPromotion;
        data.student.currentGroup = fullStudent.currentGroup;
      }
    }
    
    selectedStudentContext.value = data;
    contextDialog.value = true;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement du contexte de l\'étudiant',
      color: 'error'
    };
  }
};

const editStudent = (item) => {
  isEditing.value = true;
  student.value = { 
    ...item,
    promotions: item.promotions?.map(p => p._id || p) || [],
    groups: item.groups?.map(g => g._id || g) || [],
    currentPromotion: item.currentPromotion?._id || '',
    currentGroup: item.currentGroup?._id || ''
  };
  
  dialogOpen.value = true;
};

const confirmDelete = (item) => {
  studentToDelete.value = item;
  deleteDialog.value = true;
};

const saveStudent = async () => {
  saving.value = true;
  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/students/update/${student.value._id}`
      : 'http://localhost:5000/api/students/add';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        firstName: student.value.firstName,
        lastName: student.value.lastName,
        year: student.value.year,
        promotions: student.value.promotions,
        groups: student.value.groups,
        studentNumber: student.value.studentNumber,
        currentPromotion: student.value.currentPromotion,
        currentGroup: student.value.currentGroup,
        history: []
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de l'étudiant`);
    }

    snackbar.value = {
      show: true,
      text: `Étudiant ${isEditing.value ? 'modifié' : 'ajouté'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    await loadStudents();
    resetForm();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de l'étudiant`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const deleteStudent = async () => {
  if (!studentToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/students/delete/${studentToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'étudiant');
    }

    snackbar.value = {
      show: true,
      text: 'Étudiant supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    await loadStudents();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression de l\'étudiant',
      color: 'error'
    };
  }
};

const updateStudentAffiliations = async (studentId, affiliations) => {
  try {
    const response = await fetch(`http://localhost:5000/api/students/${studentId}/update-affiliations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(affiliations)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour des affiliations');
    }

    snackbar.value = {
      show: true,
      text: 'Affiliations mises à jour avec succès',
      color: 'success'
    };

    await loadStudents();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la mise à jour des affiliations',
      color: 'error'
    };
  }
};

const updateCurrentAffiliations = async (studentId, currentPromotion, currentGroup) => {
  try {
    const response = await fetch(`http://localhost:5000/api/students/update/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        currentPromotion,
        currentGroup
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour des affectations actuelles');
    }

    snackbar.value = {
      show: true,
      text: 'Affectations actuelles mises à jour avec succès',
      color: 'success'
    };

    await loadStudents();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la mise à jour des affectations actuelles',
      color: 'error'
    };
  }
};

const resetForm = () => {
  student.value = {
    firstName: '',
    lastName: '',
    year: '',
    promotions: [],
    groups: [],
    studentNumber: '',
    currentPromotion: '',
    currentGroup: '',
    history: []
  };
  isEditing.value = false;
};

const openAddStudentDialog = () => {
  resetForm();
  dialogOpen.value = true;
};
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.v-chip {
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: translateY(-1px);
}

.v-text-field .v-input__control {
  transition: all 0.2s ease;
}

.v-text-field:hover .v-input__control {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}

.v-data-table .v-data-table__wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.v-data-table__thead {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.v-data-table__tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.05);
}

.v-avatar {
  transition: all 0.2s ease;
}

.v-avatar:hover {
  transform: scale(1.05);
}

.rounded-lg {
  border-radius: 12px !important;
}

.elevation-3 {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1) !important;
}

.text-h4 {
  background: linear-gradient(135deg, var(--v-theme-primary), var(--v-theme-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Personnalisation du theme sombre */
.v-theme--dark .v-card {
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(10px);
}

.v-theme--dark .v-data-table__thead {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.v-theme--dark .v-data-table__tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* Amélioration responsive */
@media (max-width: 768px) {
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-data-table {
    font-size: 0.875rem;
  }
  
  .v-btn {
    min-width: auto !important;
  }
}
</style>
