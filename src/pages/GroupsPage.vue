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
      <v-col cols="12" md="4">
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
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedYear"
          :items="years"
          label="Filtrer par année"
          clearable
          variant="outlined"
          density="compact"
          @update:modelValue="loadGroups"
        ></v-select>
      </v-col>
      <v-col cols="12" md="4">
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

          <template v-slot:item.year="{ item }">
            <v-chip 
              color="primary" 
              size="small" 
              variant="tonal"
              prepend-icon="mdi-calendar-clock"
            >
              {{ item.year }}
            </v-chip>
          </template>

          <template v-slot:item.promotion="{ item }">
            <div class="d-flex align-center">
              <v-icon color="secondary" size="small" class="me-2">mdi-school</v-icon>
              <div>
                <div class="font-weight-medium">{{ item.promotion?.name || item.promotion }}</div>
                <div class="text-caption text-medium-emphasis" v-if="item.promotion?.year">
                  Année {{ item.promotion.year }}
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.subgroupsCount="{ item }">
            <v-chip 
              color="info" 
              size="small" 
              variant="tonal"
              prepend-icon="mdi-account-multiple"
            >
              {{ item.subgroupsCount || 0 }}
            </v-chip>
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
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="group.name"
                  label="Nom du groupe"
                  required
                  :rules="[v => !!v || 'Le nom du groupe est requis']"
                  variant="outlined"
                  prepend-inner-icon="mdi-account-group"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="group.year"
                  :items="years"
                  label="Année"
                  required
                  :rules="[v => !!v || 'L\'année est requise']"
                  variant="outlined"
                  prepend-inner-icon="mdi-calendar-clock"
                ></v-select>
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
                ></v-select>
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
                {{ subgroup.students?.length || 0 }} étudiant(s)
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
            ></v-text-field>
            <v-select
              v-model="newSubgroup.students"
              :items="availableStudents"
              item-title="fullName"
              item-value="_id"
              label="Étudiants"
              multiple
              chips
              closable-chips
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
const selectedYear = ref(null);
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
const years = ref(['BUT1', 'BUT2', 'BUT3']);
const promotions = ref([]);
const availableStudents = ref([]);

// Modèle groupe
const group = ref({
  name: '',
  year: '',
  promotion: ''
});

// Sous-groupes
const subgroups = ref([]);
const selectedGroup = ref(null);
const newSubgroup = ref({
  name: '',
  students: []
});

// En-têtes du tableau
const headers = ref([
  { title: 'Nom du groupe', align: 'start', key: 'name' },
  { title: 'Année', align: 'start', key: 'year' },
  { title: 'Promotion', align: 'start', key: 'promotion' },
  { title: 'Sous-groupes', align: 'start', key: 'subgroupsCount' },
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

// Chargement des données
const loadGroups = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      search: search.value || '',
      year: selectedYear.value || '',
      promotion: selectedPromotion.value || ''
    });

    const response = await fetch(`http://localhost:5000/api/groups?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des groupes');
    }

    const data = await response.json();
    groups.value = data.groups;
    pagination.value = data.pagination;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des groupes',
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
      // Garder les objets promotions complets pour l'affichage
      if (data.promotions) {
        promotions.value = data.promotions.map(promo => promo.name);
      } else {
        // Si la réponse est directement un tableau
        promotions.value = data.map(promo => promo.name || promo.toString());
      }
    } else {
      // Valeurs par défaut si l'API n'est pas disponible
      promotions.value = ['2023', '2024', '2025', '2026'];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error);
    // Valeurs par défaut en cas d'erreur
    promotions.value = ['2023', '2024', '2025', '2026'];
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
      availableStudents.value = data.map(student => ({
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadGroups();
};

const editGroup = async (item) => {
  isEditing.value = true;
  group.value = { ...item, promotion: item.promotion?._id || item.promotion };
  
  // S'assurer que les promotions sont chargées
  if (promotions.value.length === 0) {
    await loadPromotions();
  }
  
  dialogOpen.value = true;
};

const confirmDelete = (item) => {
  groupToDelete.value = item;
  deleteDialog.value = true;
};

const saveGroup = async () => {
  // Valider le formulaire avant de sauvegarder
  if (!groupForm.value) return;
  
  const { valid } = await groupForm.value.validate();
  if (!valid) return;

  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/groups/${group.value._id}`
      : 'http://localhost:5000/api/groups';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: group.value.name,
        year: group.value.year,
        promotion: group.value.promotion
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du groupe`);
    }

    snackbar.value = {
      show: true,
      text: `Groupe ${isEditing.value ? 'modifié' : 'ajouté'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    resetForm();
    await loadGroups();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} du groupe`,
      color: 'error'
    };
  }
};

const deleteGroup = async () => {
  if (!groupToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/groups/${groupToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du groupe');
    }

    snackbar.value = {
      show: true,
      text: 'Groupe supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    groupToDelete.value = null;
    await loadGroups();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression du groupe',
      color: 'error'
    };
  }
};

const viewSubgroups = async (groupItem) => {
  selectedGroup.value = groupItem;
  try {
    const response = await fetch(`http://localhost:5000/api/groups/${groupItem._id}/subgroups`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      subgroups.value = data;
      subgroupsDialog.value = true;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des sous-groupes',
      color: 'error'
    };
  }
};

const openAddSubgroupDialog = () => {
  newSubgroup.value = { name: '', students: [] };
  subgroupDialog.value = true;
};

const addSubgroup = async () => {
  if (!selectedGroup.value || !subgroupForm.value) return;

  const { valid } = await subgroupForm.value.validate();
  if (!valid) return;

  try {
    const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup.value._id}/subgroups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newSubgroup.value)
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
    await viewSubgroups(selectedGroup.value);
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de l\'ajout du sous-groupe',
      color: 'error'
    };
  }
};

const removeSubgroup = async (subgroupId) => {
  if (!selectedGroup.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup.value._id}/subgroups/${subgroupId}`, {
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

    await viewSubgroups(selectedGroup.value);
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
  group.value = {
    name: '',
    year: '',
    promotion: ''
  };
  isEditing.value = false;
  formValid.value = false;
  
  // Réinitialiser la validation du formulaire
  if (groupForm.value) {
    groupForm.value.resetValidation();
  }
};

const openAddGroupDialog = async () => {
  resetForm();
  // S'assurer que les promotions sont chargées
  if (promotions.value.length === 0) {
    await loadPromotions();
  }
  dialogOpen.value = true;
};

// Initialisation
onMounted(async () => {
  await Promise.all([
    loadGroups(),
    loadPromotions(),
    loadStudents()
  ]);
});
</script>

<style scoped>
/* Amélioration de l'apparence */
.v-data-table {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-chip {
  font-weight: 500;
}

.v-card {
  border-radius: 12px;
}

.v-dialog .v-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.v-list-item.border {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.v-list-item.border:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
