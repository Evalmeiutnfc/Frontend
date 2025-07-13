<template>
  <v-container fluid class="pa-4">
    <!-- En-tête amélioré -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-account-multiple
              </v-icon>
              Gestion des sous-groupes
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Administrez les sous-groupes et leurs étudiants
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            @click="openAddSubGroupDialog"
            prepend-icon="mdi-plus"
            variant="elevated"
            class="text-h6"
          >
            Ajouter un sous-groupe
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
                  label="Rechercher un sous-groupe"
                  placeholder="Nom du sous-groupe..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="filterSubGroups"
                  clearable
                >
                  <template v-slot:append-inner>
                    <v-fade-transition>
                      <v-icon v-if="search" size="small" color="primary">
                        mdi-account-search
                      </v-icon>
                    </v-fade-transition>
                  </template>
                </v-text-field>
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
                  item-title="name"
                  item-value="_id"
                  @update:model-value="filterSubGroups"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedGroup"
                  :items="groupOptions"
                  label="Filtrer par groupe"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-account-group"
                  item-title="name"
                  item-value="_id"
                  @update:model-value="filterSubGroups"
                  clearable
                ></v-select>
              </v-col>
            </v-row>

            <!-- Table des sous-groupes -->
            <v-data-table
              :headers="headers"
              :items="filteredSubGroups"
              :items-per-page="10"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des sous-groupes..."
              no-data-text="Aucun sous-groupe trouvé"
              items-per-page-text="Sous-groupes par page"
            >
              <!-- Nom avec icône -->
              <template v-slot:item.name="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="orange" size="32" class="mr-3">
                    <v-icon color="white">mdi-account-multiple</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.type || 'Standard' }}</div>
                  </div>
                </div>
              </template>

              <!-- Type avec chip -->
              <template v-slot:item.type="{ item }">
                <v-chip
                  :color="getTypeColor(item.type)"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  {{ item.type || 'Standard' }}
                </v-chip>
              </template>

              <!-- Promotion -->
              <template v-slot:item.promotion="{ item }">
                <v-chip
                  v-if="item.promotion"
                  color="primary"
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-school"
                  class="font-weight-medium"
                >
                  {{ item.promotion.name }} ({{ item.promotion.year }})
                </v-chip>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Groupe -->
              <template v-slot:item.group="{ item }">
                <v-chip
                  v-if="item.group"
                  color="info"
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-account-group"
                  class="font-weight-medium"
                >
                  {{ item.group.name }}
                </v-chip>
                <span v-else class="text-medium-emphasis">-</span>
              </template>

              <!-- Étudiants -->
              <template v-slot:item.students="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="success" class="mr-2">mdi-account-multiple</v-icon>
                  <span class="font-weight-medium">{{ item.students?.length || 0 }} étudiant(s)</span>
                  <v-btn
                    v-if="item.students?.length > 0"
                    icon="mdi-eye"
                    variant="text"
                    color="info"
                    size="small"
                    class="ml-2"
                    @click="viewStudents(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les étudiants</v-tooltip>
                  </v-btn>
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    color="primary" 
                    size="small"
                    @click="editSubGroup(item)"
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

    <!-- Dialog d'ajout/modification de sous-groupe -->
    <v-dialog v-model="dialogOpen" max-width="800px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ isEditing ? 'mdi-account-edit' : 'mdi-account-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ isEditing ? 'Modifier le sous-groupe' : 'Ajouter un sous-groupe' }}
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ isEditing ? 'Modifiez les informations du sous-groupe' : 'Créez un nouveau sous-groupe' }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="form" v-model="formValid">
            <v-row>
              <!-- Informations de base -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                  Informations du sous-groupe
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="subGroup.name"
                  label="Nom du sous-groupe"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-multiple"
                  required
                  :rules="[v => !!v || 'Le nom est requis']"
                  placeholder="Ex: TP1, Groupe A..."
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="subGroup.type"
                  :items="typeOptions"
                  label="Type de sous-groupe"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-tag"
                  placeholder="Sélectionnez le type"
                ></v-select>
              </v-col>

              <!-- Affectations -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3 mt-4">
                  <v-icon color="primary" class="mr-2">mdi-school</v-icon>
                  Affectations
                </h4>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="subGroup.promotion"
                  :items="promotionOptions"
                  label="Promotion"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-school"
                  item-title="name"
                  item-value="_id"
                  required
                  :rules="[v => !!v || 'La promotion est requise']"
                  @update:model-value="onPromotionChange"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="subGroup.group"
                  :items="filteredGroupOptions"
                  label="Groupe parent"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-group"
                  item-title="name"
                  item-value="_id"
                  required
                  :rules="[v => !!v || 'Le groupe parent est requis']"
                  :disabled="!subGroup.promotion"
                  @update:model-value="onGroupChange"
                ></v-select>
              </v-col>

              <!-- Étudiants -->
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3 mt-4">
                  <v-icon color="primary" class="mr-2">mdi-account-multiple</v-icon>
                  Étudiants du sous-groupe
                </h4>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="subGroup.students"
                  :items="availableStudents"
                  label="Sélectionner les étudiants"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-multiple"
                  item-title="fullName"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                  :disabled="!subGroup.promotion"
                  placeholder="Sélectionnez d'abord une promotion"
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :prepend-avatar="`https://ui-avatars.com/api/?name=${encodeURIComponent(item.raw.fullName)}&background=random`"
                      :text="item.raw.fullName"
                    ></v-chip>
                  </template>
                </v-select>
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
            @click="saveSubGroup" 
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
          Êtes-vous sûr de vouloir supprimer ce sous-groupe ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteSubGroup">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de visualisation des étudiants -->
    <v-dialog v-model="studentsDialog" max-width="600px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">mdi-account-multiple</v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                Étudiants du sous-groupe
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedSubGroup?.name }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <div v-if="selectedSubGroup?.students?.length > 0">
            <v-list>
              <v-list-item
                v-for="student in selectedSubGroup.students"
                :key="student._id"
                class="border rounded mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar color="green" size="40">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ student.firstName }} {{ student.lastName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Étudiant
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
          <v-alert v-else type="info" variant="tonal">
            Aucun étudiant assigné à ce sous-groupe
          </v-alert>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="studentsDialog = false"
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
const subGroups = ref([]);
const filteredSubGroups = ref([]);
const search = ref('');
const selectedPromotion = ref(null);
const selectedGroup = ref(null);

// Options pour les filtres
const promotionOptions = ref([]);
const groupOptions = ref([]);
const studentOptions = ref([]);
const filteredGroupOptionsForPromotion = ref([]);

const typeOptions = ref([
  { title: 'TP (Travaux Pratiques)', value: 'TP' },
  { title: 'TD (Travaux Dirigés)', value: 'TD' },
  { title: 'Projet', value: 'Projet' },
  { title: 'Stage', value: 'Stage' },
  { title: 'Standard', value: 'Standard' },
  { title: 'Autre', value: 'Autre' }
]);

// Modèle sous-groupe
const subGroup = ref({
  name: '',
  type: 'Standard',
  group: '',
  promotion: '',
  students: []
});

// En-têtes du tableau
const headers = ref([
  { title: 'Nom', align: 'start', key: 'name', sortable: true },
  { title: 'Type', align: 'start', key: 'type', sortable: true },
  { title: 'Promotion', align: 'start', key: 'promotion', sortable: false },
  { title: 'Groupe', align: 'start', key: 'group', sortable: false },
  { title: 'Étudiants', align: 'start', key: 'students', sortable: false },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Formulaire et dialogue
const dialogOpen = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const deleteDialog = ref(false);
const subGroupToDelete = ref(null);
const studentsDialog = ref(false);
const selectedSubGroup = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Computed qui affiche tous les étudiants en mode test
const allStudentsWithFullName = computed(() => {
  return studentOptions.value.map(student => ({
    ...student,
    fullName: `${student.firstName} ${student.lastName}`
  }));
});

// Computed properties
const filteredGroupOptions = computed(() => {
  if (!subGroup.value.promotion) return [];
  
  console.log('Groupes filtrés pour la promotion:', filteredGroupOptionsForPromotion.value);
  return filteredGroupOptionsForPromotion.value;
});

// Computed qui bascule entre mode normal et mode test
const availableStudents = computed(() => {
  console.log('=== Calcul des étudiants disponibles ===');
  console.log('Promotion sélectionnée:', subGroup.value.promotion);
  console.log('Groupe sélectionné:', subGroup.value.group);
  console.log('Nombre total d\'étudiants:', studentOptions.value.length);
  
  // Si aucune promotion n'est sélectionnée, retourner un tableau vide
  if (!subGroup.value.promotion) {
    console.log('Aucune promotion sélectionnée, retour tableau vide');
    return [];
  }
  
  // Si aucun étudiant n'est chargé, retourner un tableau vide
  if (!studentOptions.value || studentOptions.value.length === 0) {
    console.log('Aucun étudiant chargé');
    return [];
  }
  
  let filtered = studentOptions.value;
  console.log('Étudiants de base:', filtered.length);
  
  // Filtrer par promotion (les étudiants ont un array "promotions")
  filtered = filtered.filter(student => {
    if (!student) return false;
    
    console.log('Étudiant en cours de vérification:', {
      nom: `${student.firstName} ${student.lastName}`,
      promotions: student.promotions,
      currentPromotion: student.currentPromotion,
      groups: student.groups,
      currentGroup: student.currentGroup
    });
    
    // Vérifier dans le tableau promotions
    const studentPromotions = student.promotions || [];
    const belongsToPromotion = studentPromotions.some(promotion => {
      const promotionId = promotion._id || promotion;
      return promotionId === subGroup.value.promotion;
    });
    
    // Vérifier aussi currentPromotion si elle existe
    const currentPromotionId = student.currentPromotion?._id || student.currentPromotion;
    const hasCurrentPromotion = currentPromotionId === subGroup.value.promotion;
    
    const matchesPromotion = belongsToPromotion || hasCurrentPromotion;
    
    console.log(`Étudiant ${student.firstName} ${student.lastName}:`, {
      promotionsDeLEtudiant: studentPromotions,
      currentPromotion: currentPromotionId,
      promotionSelectionnee: subGroup.value.promotion,
      correspond: matchesPromotion
    });
    
    return matchesPromotion;
  });
  
  console.log('Après filtrage par promotion:', filtered.length);
  
  // Si un groupe est sélectionné, filtrer aussi par groupe
  if (subGroup.value.group) {
    console.log('Filtrage supplémentaire par groupe:', subGroup.value.group);
    
    filtered = filtered.filter(student => {
      const studentGroups = student.groups || [];
      const currentGroupId = student.currentGroup?._id || student.currentGroup;
      
      console.log(`Groupes de l'étudiant ${student.firstName}:`, studentGroups);
      console.log(`Groupe actuel de l'étudiant ${student.firstName}:`, currentGroupId);
      
      // Vérifier dans le tableau groups
      const belongsToGroup = studentGroups.some(group => {
        const groupId = group._id || group;
        const match = groupId === subGroup.value.group;
        console.log(`Groupe ${groupId} === ${subGroup.value.group} ? ${match}`);
        return match;
      });
      
      // Vérifier aussi currentGroup si elle existe
      const hasCurrentGroup = currentGroupId === subGroup.value.group;
      
      const finalMatch = belongsToGroup || hasCurrentGroup;
      
      console.log(`Étudiant ${student.firstName} appartient au groupe:`, finalMatch);
      return finalMatch;
    });
    
    console.log('Après filtrage par groupe:', filtered.length);
  }
  
  // Ajouter le nom complet pour l'affichage
  const result = filtered.map(student => ({
    ...student,
    fullName: `${student.firstName} ${student.lastName}`
  }));
    
  console.log('=== Résultat final ===');
  console.log('Étudiants disponibles:', result.length);
  console.log('Liste:', result.map(s => s.fullName));
  
  return result;
});

// Chargement des données au montage du composant
onMounted(async () => {
  await loadPromotions();
  await loadGroups();
  await loadStudents();
  await loadSubGroups();
});

// Méthodes utilitaires
const getTypeColor = (type) => {
  switch (type) {
    case 'TP': return 'orange';
    case 'TD': return 'blue';
    case 'Projet': return 'purple';
    case 'Stage': return 'green';
    default: return 'grey';
  }
};

// Méthodes
const loadSubGroups = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/subgroups/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-groupes');
    }

    const data = await response.json();
    subGroups.value = data || [];
    filteredSubGroups.value = subGroups.value;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des sous-groupes',
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
      // La nouvelle API retourne { promotions: [...], pagination: {...} }
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
      console.log('Données des groupes reçues:', data);
      // La nouvelle API retourne { groups: [...], pagination: {...} }
      groupOptions.value = data.groups || data || [];
      console.log('Groupes chargés:', groupOptions.value);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des groupes:', error);
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
      console.log('Données des étudiants reçues:', data);
      // La nouvelle API retourne { students: [...], pagination: {...} }
      studentOptions.value = data.students || data || [];
      console.log('Étudiants chargés:', studentOptions.value);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
  }
};

const filterSubGroups = () => {
  filteredSubGroups.value = subGroups.value.filter(subgroup => {
    const matchesSearch = search.value === '' || 
      subgroup.name?.toLowerCase().includes(search.value.toLowerCase());
      
    // Gérer les promotions qui peuvent être des objets peuplés ou des IDs
    const matchesPromotion = selectedPromotion.value === null || 
      (subgroup.promotion?._id === selectedPromotion.value || subgroup.promotion === selectedPromotion.value);
      
    // Gérer les groupes qui peuvent être des objets peuplés ou des IDs  
    const matchesGroup = selectedGroup.value === null || 
      (subgroup.group?._id === selectedGroup.value || subgroup.group === selectedGroup.value);
      
    return matchesSearch && matchesPromotion && matchesGroup;
  });
};

const onPromotionChange = async () => {
  subGroup.value.group = '';

  if (subGroup.value.promotion) {
    console.log('Chargement des groupes pour la promotion:', subGroup.value.promotion);

    try {
      const response = await fetch(`http://localhost:5000/api/promotions/${subGroup.value.promotion}/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Groupes reçus pour la promotion:', data);
        
        // Gérer les différents formats de réponse possibles
        if (Array.isArray(data)) {
          // Si la réponse est directement un tableau
          filteredGroupOptionsForPromotion.value = data;
        } else if (data.groups && Array.isArray(data.groups)) {
          // Si la réponse contient un objet avec une propriété groups
          filteredGroupOptionsForPromotion.value = data.groups;
        } else if (data.data && Array.isArray(data.data)) {
          // Si la réponse contient un objet avec une propriété data
          filteredGroupOptionsForPromotion.value = data.data;
        } else {
          console.warn('Format de réponse inattendu:', data);
          filteredGroupOptionsForPromotion.value = [];
        }
        
        console.log('Groupes filtrés assignés:', filteredGroupOptionsForPromotion.value);
      } else {
        console.error('Erreur lors de la récupération des groupes par promotion');
        filteredGroupOptionsForPromotion.value = [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes par promotion:', error);
      filteredGroupOptionsForPromotion.value = [];
    }
  } else {
    filteredGroupOptionsForPromotion.value = [];
  }
};


const onGroupChange = () => {
  // Ne pas vider automatiquement les étudiants sélectionnés
  // Le computed availableStudents se charge de les filtrer automatiquement
  console.log('Groupe changé vers:', subGroup.value.group);
};

const viewStudents = (item) => {
  selectedSubGroup.value = item;
  studentsDialog.value = true;
};

const editSubGroup = (item) => {
  isEditing.value = true;
  subGroup.value = { 
    ...item,
    promotion: item.promotion?._id || '',
    group: item.group?._id || '',
    students: item.students?.map(s => s._id) || []
  };
  dialogOpen.value = true;
};

const confirmDelete = (item) => {
  subGroupToDelete.value = item;
  deleteDialog.value = true;
};

const saveSubGroup = async () => {
  saving.value = true;
  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/subgroups/update/${subGroup.value._id}`
      : 'http://localhost:5000/api/subgroups/add';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: subGroup.value.name,
        type: subGroup.value.type,
        group: subGroup.value.group,
        promotion: subGroup.value.promotion,
        students: subGroup.value.students
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du sous-groupe`);
    }

    snackbar.value = {
      show: true,
      text: `Sous-groupe ${isEditing.value ? 'modifié' : 'ajouté'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    await loadSubGroups();
    resetForm();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du sous-groupe`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const deleteSubGroup = async () => {
  if (!subGroupToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/subgroups/delete/${subGroupToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du sous-groupe');
    }

    snackbar.value = {
      show: true,
      text: 'Sous-groupe supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    await loadSubGroups();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression du sous-groupe',
      color: 'error'
    };
  }
};

const resetForm = () => {
  subGroup.value = {
    name: '',
    type: 'Standard',
    group: '',
    promotion: '',
    students: []
  };
  filteredGroupOptionsForPromotion.value = [];
  isEditing.value = false;
};

const openAddSubGroupDialog = () => {
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
