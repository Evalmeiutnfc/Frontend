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
              Gestion des promotions
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Gérez les promotions et années scolaires de votre établissement
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            @click="openAddPromotionDialog"
            prepend-icon="mdi-plus"
            variant="elevated"
            class="text-h6"
          >
            Ajouter une promotion
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-text class="pa-6">
            <!-- Filtres améliorés -->
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="search"
                  label="Rechercher une promotion"
                  placeholder="Nom, année..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="debouncedSearch"
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
                <v-chip-group v-model="selectedFilter" column>
                  <v-chip
                    color="primary"
                    variant="outlined"
                    @click="filterByYear('current')"
                    prepend-icon="mdi-calendar-today"
                  >
                    Année courante
                  </v-chip>
                  <v-chip
                    color="secondary"
                    variant="outlined"
                    @click="filterByYear('all')"
                    prepend-icon="mdi-calendar-multiple"
                  >
                    Toutes les années
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <!-- Tableau des promotions -->
            <v-data-table
              :headers="headers"
              :items="promotions"
              :loading="loading"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              @update:options="handleTableOptions"
              class="elevation-1 rounded-lg"
              loading-text="Chargement des promotions..."
              no-data-text="Aucune promotion trouvée"
              items-per-page-text="Promotions par page"
            >
              <!-- Nom de la promotion avec icône -->
              <template v-slot:item.name="{ item }">
                <div class="d-flex align-center">
                  <v-avatar 
                    color="primary" 
                    size="32" 
                    class="mr-3"
                  >
                    <v-icon color="white">mdi-school</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis">Promotion {{ item.year }}</div>
                  </div>
                </div>
              </template>

              <!-- Année avec chip -->
              <template v-slot:item.year="{ item }">
                <v-chip 
                  color="secondary" 
                  size="small" 
                  variant="flat"
                  prepend-icon="mdi-calendar"
                >
                  {{ item.year }}
                </v-chip>
              </template>

              <!-- Nombre de groupes -->
              <template v-slot:item.groupsCount="{ item }">
                <v-chip 
                  color="info" 
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-account-group"
                >
                  {{ item.groups?.length || 0 }} {{ (item.groups?.length || 0) > 1 ? 'groupes' : 'groupe' }}
                </v-chip>
              </template>

              <!-- Date de création -->
              <template v-slot:item.createdAt="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-calendar-plus</v-icon>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    color="info"
                    @click="viewGroups(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les groupes</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="editPromotion(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
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

    <!-- Dialog d'ajout/modification de promotion -->
    <v-dialog v-model="dialogOpen" max-width="600px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ isEditing ? 'mdi-school-edit' : 'mdi-school-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ isEditing ? 'Modifier la promotion' : 'Ajouter une promotion' }}
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ isEditing ? 'Modifiez les informations de la promotion' : 'Créez une nouvelle promotion' }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="promotionForm" v-model="formValid" lazy-validation>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="promotion.name"
                  label="Nom de la promotion"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-school"
                  required
                  :rules="[v => !!v || 'Le nom de la promotion est requis']"
                  placeholder="Ex: BUT Informatique 1ère année"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="promotion.year"
                  label="Année"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                  required
                  :rules="[v => !!v || 'L\'année est requise', v => /^\d{4}$/.test(v) || 'L\'année doit être au format YYYY']"
                  placeholder="Ex: 2024"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="promotion.description"
                  label="Description (optionnel)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-text"
                  rows="3"
                  placeholder="Description de la promotion..."
                ></v-textarea>
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
            @click="savePromotion" 
            :disabled="!formValid"
            :loading="saving"
            prepend-icon="mdi-check"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de visualisation des groupes -->
    <v-dialog v-model="groupsDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Groupes de la promotion {{ selectedPromotion?.name }}</span>
        </v-card-title>
        <v-card-text>
          <v-list v-if="promotionGroups.length > 0">
            <v-list-item
              v-for="group in promotionGroups"
              :key="group._id"
              class="border rounded mb-2"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-account-group</v-icon>
              </template>
              <v-list-item-title>{{ group.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Année: {{ group.year }} | {{ group.subgroupsCount || 0 }} sous-groupe(s)
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            Aucun groupe assigné à cette promotion.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="groupsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible et peut affecter les groupes associés.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deletePromotion">Supprimer</v-btn>
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

// Fonction pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// État de la page
const loading = ref(false);
const saving = ref(false);
const promotions = ref([]);
const search = ref('');
const selectedFilter = ref(null);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Modèle promotion
const promotion = ref({
  name: '',
  year: '',
  description: ''
});

// Groupes de la promotion sélectionnée
const promotionGroups = ref([]);
const selectedPromotion = ref(null);

// En-têtes du tableau
const headers = ref([
  { title: 'Promotion', align: 'start', key: 'name' },
  { title: 'Année', align: 'start', key: 'year' },
  { title: 'Groupes', align: 'start', key: 'groupsCount' },
  { title: 'Créé le', align: 'start', key: 'createdAt' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// États des dialogues
const dialogOpen = ref(false);
const groupsDialog = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const deleteDialog = ref(false);
const promotionToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Références des formulaires
const promotionForm = ref(null);

// Recherche débounced
const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  loadPromotions();
}, 300);

// Chargement des données
const loadPromotions = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString()
    });

    const response = await fetch(`http://localhost:5000/api/promotions?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des promotions');
    }

    const data = await response.json();
    promotions.value = data.promotions;
    pagination.value = data.pagination;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des promotions',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadPromotions();
};

const editPromotion = (item) => {
  isEditing.value = true;
  promotion.value = { ...item };
  dialogOpen.value = true;
};

const confirmDelete = (item) => {
  promotionToDelete.value = item;
  deleteDialog.value = true;
};

const savePromotion = async () => {
  // Valider le formulaire avant de sauvegarder
  if (!promotionForm.value) return;
  
  const { valid } = await promotionForm.value.validate();
  if (!valid) return;

  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/promotions/${promotion.value._id}`
      : 'http://localhost:5000/api/promotions';

    const method = isEditing.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: promotion.value.name,
        year: promotion.value.year
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de la promotion`);
    }

    snackbar.value = {
      show: true,
      text: `Promotion ${isEditing.value ? 'modifiée' : 'ajoutée'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    resetForm();
    await loadPromotions();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de la promotion`,
      color: 'error'
    };
  }
};

const deletePromotion = async () => {
  if (!promotionToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/promotions/${promotionToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de la promotion');
    }

    snackbar.value = {
      show: true,
      text: 'Promotion supprimée avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    promotionToDelete.value = null;
    await loadPromotions();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression de la promotion',
      color: 'error'
    };
  }
};

const viewGroups = async (promotionItem) => {
  selectedPromotion.value = promotionItem;
  try {
    const response = await fetch(`http://localhost:5000/api/promotions/${promotionItem._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      promotionGroups.value = data.groups || [];
      groupsDialog.value = true;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des groupes',
      color: 'error'
    };
  }
};

const resetForm = () => {
  promotion.value = {
    name: '',
    year: ''
  };
  isEditing.value = false;
  formValid.value = false;
  
  // Réinitialiser la validation du formulaire
  if (promotionForm.value) {
    promotionForm.value.resetValidation();
  }
};

const openAddPromotionDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

// Méthodes de filtrage
const filterByYear = (type) => {
  if (type === 'current') {
    const currentYear = new Date().getFullYear();
    search.value = currentYear.toString();
    selectedFilter.value = 'current';
  } else {
    search.value = '';
    selectedFilter.value = null;
  }
  debouncedSearch();
};

// Initialisation
onMounted(() => {
  loadPromotions();
});
</script>

<style scoped>
/* Styles supplémentaires si nécessaires */
</style>
