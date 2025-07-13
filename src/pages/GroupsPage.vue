<template>
  <v-container fluid class="pa-4">
    <!-- En-tête -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h4 font-weight-bold">Gestion des groupes</h2>
            <p class="text-subtitle-1 text-medium-emphasis mt-1">
              Gestion des groupes TD et de leurs sous-groupes
            </p>
          </div>
          <v-btn
            color="primary"
            @click="openAddGroupDialog"
            prepend-icon="mdi-plus"
          >
            Ajouter un groupe
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filtres -->
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          label="Rechercher..."
          prepend-inner-icon="mdi-magnify"
          clearable
          variant="outlined"
          density="compact"
          @input="debouncedSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedPromotion"
          :items="promotions"
          label="Filtrer par promotion"
          clearable
          variant="outlined"
          density="compact"
          @update:modelValue="loadGroups"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Tableau des groupes -->
    <v-row>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="groups"
          :loading="loading"
          :items-per-page="pagination.limit"
          :page="pagination.page"
          :server-items-length="pagination.total"
          @update:options="handleTableOptions"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-icon color="primary" class="me-2">mdi-account-group</v-icon>
              <span class="font-weight-medium">{{ item.name }}</span>
            </div>
          </template>

          <template v-slot:item.promotion="{ item }">
            <div class="d-flex align-center">
              <v-icon color="secondary" size="small" class="me-2">mdi-school</v-icon>
              <div>
                <div class="font-weight-medium">
                  {{ item.promotion?.name || 'Non définie' }}
                </div>
                <div class="text-caption text-medium-emphasis" v-if="item.promotion?.year">
                  Année {{ item.promotion.year }}
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip text="Voir les sous-groupes">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="viewSubgroups(item)"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Modifier">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="editGroup(item)"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Supprimer">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification de groupe -->
    <v-dialog v-model="dialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ isEditing ? 'Modifier le groupe' : 'Ajouter un groupe' }}</v-card-title>
        <v-card-text>
          <v-form ref="groupForm" v-model="formValid" lazy-validation>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="group.name"
                  label="Nom du groupe"
                  required
                  :rules="[v => !!v || 'Le nom du groupe est requis']"
                  variant="outlined"
                  prepend-inner-icon="mdi-account-group"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="group.promotion"
                  :items="promotions"
                  label="Promotion"
                  required
                  :rules="[v => !!v || 'La promotion est requise']"
                  variant="outlined"
                  prepend-inner-icon="mdi-school"
                  item-title="title"
                  item-value="value"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="group.description"
                  label="Description (optionnel)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-text"
                  rows="3"
                  placeholder="Description du groupe..."
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="dialogOpen = false">Annuler</v-btn>
          <v-btn color="primary" @click="saveGroup" :disabled="!formValid">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de visualisation des sous-groupes -->
    <v-dialog v-model="subgroupsDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Sous-groupes de {{ selectedGroup?.name }}</span>
          <v-btn
            color="primary"
            @click="openAddSubgroupDialog"
            prepend-icon="mdi-plus"
            size="small"
          >
            Ajouter
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-list v-if="subgroups.length > 0">
            <v-list-item
              v-for="subgroup in subgroups"
              :key="subgroup._id"
              class="border rounded mb-2"
            >
              <template v-slot:prepend>
                <v-icon color="info">mdi-account-multiple</v-icon>
              </template>
              <v-list-item-title>{{ subgroup.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <div class="d-flex align-center gap-2">
                  <v-chip 
                    size="x-small" 
                    color="secondary" 
                    variant="tonal"
                    v-if="subgroup.type"
                  >
                    {{ subgroup.type }}
                  </v-chip>
                  <span>{{ subgroup.students?.length || 0 }} étudiant(s)</span>
                </div>
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeSubgroup(subgroup._id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            Aucun sous-groupe défini pour ce groupe.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="subgroupsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'ajout de sous-groupe -->
    <v-dialog v-model="subgroupDialog" max-width="500px">
      <v-card>
        <v-card-title>Ajouter un sous-groupe</v-card-title>
        <v-card-text>
          <v-form ref="subgroupForm" v-model="subgroupFormValid" lazy-validation>
            <v-text-field
              v-model="newSubgroup.name"
              label="Nom du sous-groupe"
              required
              :rules="[v => !!v || 'Le nom du sous-groupe est requis']"
              variant="outlined"
              prepend-inner-icon="mdi-account-multiple"
              class="mb-3"
            ></v-text-field>
            <v-select
              v-model="newSubgroup.type"
              :items="['Travaux Pratiques', 'Projet', 'TD', 'Cours', 'Autre']"
              label="Type de sous-groupe"
              variant="outlined"
              prepend-inner-icon="mdi-shape"
              class="mb-3"
            ></v-select>
            <v-select
              v-model="newSubgroup.students"
              :items="availableStudents"
              item-title="fullName"
              item-value="_id"
              label="Étudiants"
              multiple
              chips
              closable-chips
              variant="outlined"
              prepend-inner-icon="mdi-account-group"
              placeholder="Sélectionner des étudiants..."
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="subgroupDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="addSubgroup" :disabled="!subgroupFormValid">Ajouter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteGroup">Supprimer</v-btn>
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
import { ref, onMounted } from 'vue';

// Fonction debounce native
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// État de la page
const loading = ref(false);
const groups = ref([]);
const search = ref('');
const selectedPromotion = ref(null);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Listes de référence
const promotions = ref([]);
const availableStudents = ref([]);

// Modèle groupe
const group = ref({
  name: '',
  promotion: '',
  description: ''
});

// Sous-groupes
const subgroups = ref([]);
const selectedGroup = ref(null);
const newSubgroup = ref({
  name: '',
  type: 'Travaux Pratiques',
  students: []
});

// En-têtes du tableau
const headers = ref([
  { title: 'Nom du groupe', align: 'start', key: 'name' },
  { title: 'Promotion', align: 'start', key: 'promotion' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// États des dialogues
const dialogOpen = ref(false);
const subgroupsDialog = ref(false);
const subgroupDialog = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const subgroupFormValid = ref(false);
const deleteDialog = ref(false);
const groupToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Références des formulaires
const groupForm = ref(null);
const subgroupForm = ref(null);

// Recherche débounced
const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  loadGroups();
}, 300);

// Gestion des options du tableau (pagination, tri, etc.)
const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadGroups();
};

// Chargement des données
const loadGroups = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      search: search.value || '',
      promotion: selectedPromotion.value || ''
    });

    const response = await fetch(`http://localhost:5000/api/groups?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des groupes');
    }

    const data = await response.json();
    groups.value = data.groups;
    pagination.value.total = data.total;
    pagination.value.pages = data.pages;
    pagination.value.hasNextPage = data.hasNextPage;
    pagination.value.hasPrevPage = data.hasPrevPage;
  } catch (error) {
    console.error(error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des groupes',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

// Ouverture du dialogue d'ajout de groupe
const openAddGroupDialog = async () => {
  group.value = {
    name: '',
    promotion: '',
    description: ''
  };
  isEditing.value = false;
  
  // Charger les promotions si elles ne sont pas déjà chargées
  if (promotions.value.length === 0) {
    await loadPromotions();
  }
  
  dialogOpen.value = true;
};

// Chargement des promotions
const loadPromotions = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/promotions', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des promotions');
    }

    const data = await response.json();
    console.log('Promotions chargées :', data);
    
    // Adapter les promotions pour le v-select
    if (data.promotions && Array.isArray(data.promotions)) {
      promotions.value = data.promotions.map(promo => ({
        title: `${promo.name} (${promo.year})`,
        value: promo._id
      }));
    } else {
      promotions.value = [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des promotions',
      color: 'error'
    };
  }
};

// Édition d'un groupe
const editGroup = async (item) => {
  isEditing.value = true;
  group.value = { 
    ...item, 
    promotion: item.promotion?._id || item.promotion 
  };
  
  // Charger les promotions si elles ne sont pas déjà chargées
  if (promotions.value.length === 0) {
    await loadPromotions();
  }
  
  dialogOpen.value = true;
};

// Sauvegarde du groupe (ajout ou modification)
const saveGroup = async () => {
  if (!formValid.value) return;

  loading.value = true;
  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/groups/update/${group.value._id}`
      : 'http://localhost:5000/api/groups/add';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: group.value.name,
        promotion: group.value.promotion,
        description: group.value.description
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la sauvegarde du groupe');
    }

    snackbar.value = {
      show: true,
      text: `Groupe ${isEditing.value ? 'modifié' : 'ajouté'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    loadGroups();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la sauvegarde du groupe',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

// Ouverture du dialogue de visualisation des sous-groupes
const viewSubgroups = (group) => {
  selectedGroup.value = group;
  subgroupsDialog.value = true;
  loadSubgroups(group._id);
};

// Chargement des sous-groupes d'un groupe
const loadSubgroups = async (groupId) => {
  loading.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/groups/${groupId}/subgroups`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-groupes');
    }

    const data = await response.json();
    subgroups.value = data.subgroups;
  } catch (error) {
    console.error(error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des sous-groupes',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

// Ouverture du dialogue d'ajout de sous-groupe
const openAddSubgroupDialog = () => {
  newSubgroup.value = {
    name: '',
    type: 'Travaux Pratiques',
    students: []
  };
  subgroupDialog.value = true;
};

// Ajout d'un sous-groupe
const addSubgroup = async () => {
  if (!subgroupFormValid.value) return;

  loading.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/subgroups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newSubgroup.value,
        groupId: selectedGroup.value._id
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout du sous-groupe');
    }

    snackbar.value = {
      show: true,
      text: 'Sous-groupe ajouté avec succès',
      color: 'success'
    };

    subgroupDialog.value = false;
    loadSubgroups(selectedGroup.value._id);
  } catch (error) {
    console.error(error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de l\'ajout du sous-groupe',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

// Confirmation de suppression d'un groupe
const confirmDelete = (group) => {
  groupToDelete.value = group;
  deleteDialog.value = true;
};

// Suppression d'un groupe
const deleteGroup = async () => {
  if (!groupToDelete.value) return;

  console.log('Tentative de suppression du groupe avec ID :', groupToDelete.value._id);

  loading.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/groups/delete/${groupToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur retournée par le backend :', errorData);
      throw new Error(errorData.message || 'Erreur lors de la suppression du groupe');
    }

    snackbar.value = {
      show: true,
      text: 'Groupe supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    groupToDelete.value = null;
    loadGroups();
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe :', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la suppression du groupe',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadGroups();
  await loadPromotions();
  
  // Chargement des étudiants disponibles
  try {
    const response = await fetch('http://localhost:5000/api/students', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      availableStudents.value = data.students || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
  }
});
</script>
