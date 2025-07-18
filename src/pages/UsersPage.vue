<template>
  <v-container fluid class="pa-4">
    <!-- En-tête de la page -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-account-group
              </v-icon>
              Gestion des utilisateurs
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Administrez les comptes utilisateurs et leurs rôles
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            @click="openAddUserDialog"
            prepend-icon="mdi-account-plus"
            variant="elevated"
            class="text-h6"
          >
            Ajouter un utilisateur
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Statistiques des utilisateurs -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="rounded-lg elevation-2" color="primary" variant="flat">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-icon size="40" color="white" class="mr-3">mdi-account-group</v-icon>
              <div class="text-white">
                <div class="text-h4 font-weight-bold">{{ totalUsers }}</div>
                <div class="text-subtitle-1">Total utilisateurs</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg elevation-2" color="success" variant="flat">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-icon size="40" color="white" class="mr-3">mdi-school</v-icon>
              <div class="text-white">
                <div class="text-h4 font-weight-bold">{{ totalProfessors }}</div>
                <div class="text-subtitle-1">Professeurs</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg elevation-2" color="warning" variant="flat">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-icon size="40" color="white" class="mr-3">mdi-shield-crown</v-icon>
              <div class="text-white">
                <div class="text-h4 font-weight-bold">{{ totalAdmins }}</div>
                <div class="text-subtitle-1">Administrateurs</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtres et recherche -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-text class="pa-6">
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="search"
                  label="Rechercher un utilisateur"
                  placeholder="Nom, prénom, email, login..."
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
                        mdi-account-search
                      </v-icon>
                    </v-fade-transition>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedRole"
                  :items="roleOptions"
                  label="Filtrer par rôle"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-shield-account"
                  @update:model-value="loadUsers"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn
                  @click="loadUsers"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  block
                >
                  Actualiser
                </v-btn>
              </v-col>
            </v-row>

            <!-- Tableau des utilisateurs -->
            <v-data-table
              :headers="headers"
              :items="users"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des utilisateurs..."
              no-data-text="Aucun utilisateur trouvé"
              items-per-page-text="Utilisateurs par page"
              @update:options="handleTableOptions"
            >
              <!-- Nom complet avec avatar -->
              <template v-slot:item.fullName="{ item }">
                <div class="d-flex align-center">
                  <v-avatar 
                    :color="getRoleColor(item.role)" 
                    size="40" 
                    class="mr-3"
                  >
                    <v-icon color="white">{{ getRoleIcon(item.role) }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                  </div>
                </div>
              </template>

              <!-- Login -->
              <template v-slot:item.login="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-account</v-icon>
                  <span class="font-weight-medium">{{ item.login }}</span>
                </div>
              </template>

              <!-- Rôle avec chip -->
              <template v-slot:item.role="{ item }">
                <v-chip
                  :color="getRoleColor(item.role)"
                  size="small"
                  variant="flat"
                  :prepend-icon="getRoleIcon(item.role)"
                  class="font-weight-medium"
                >
                  {{ getRoleLabel(item.role) }}
                </v-chip>
              </template>

              <!-- Date de création -->
              <template v-slot:item.createdAt="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="info" class="mr-2">mdi-calendar</v-icon>
                  <span>{{ formatDate(item.createdAt) }}</span>
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
                    @click="viewUser(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les détails</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-pencil" 
                    variant="text" 
                    color="primary" 
                    size="small"
                    @click="editUser(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-shield-edit" 
                    variant="text" 
                    color="warning" 
                    size="small"
                    @click="changeUserRole(item)"
                  >
                    <v-icon size="small">mdi-shield-edit</v-icon>
                    <v-tooltip activator="parent" location="top">Changer le rôle</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-key-variant" 
                    variant="text" 
                    color="orange" 
                    size="small"
                    @click="resetPassword(item)"
                  >
                    <v-icon size="small">mdi-key-variant</v-icon>
                    <v-tooltip activator="parent" location="top">Réinitialiser le mot de passe</v-tooltip>
                  </v-btn>
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    color="error" 
                    size="small"
                    @click="confirmDelete(item)"
                    :disabled="item._id === currentUser?._id"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">
                      {{ item._id === currentUser?._id ? 'Impossible de supprimer votre propre compte' : 'Supprimer' }}
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification d'utilisateur -->
    <v-dialog v-model="userDialog" max-width="600px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ isEditing ? 'mdi-account-edit' : 'mdi-account-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ isEditing ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur' }}
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur' }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="userForm" v-model="userFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.firstName"
                  label="Prénom"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.lastName"
                  label="Nom"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="userFormData.email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-email"
                  :rules="[rules.required, rules.email]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.login"
                  label="Login"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-circle"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="userFormData.role"
                  :items="roleSelectOptions"
                  label="Rôle"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-shield-account"
                  :rules="[rules.required]"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" v-if="!isEditing">
                <v-text-field
                  v-model="userFormData.password"
                  label="Mot de passe"
                  type="password"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock"
                  :rules="[rules.required, rules.minLength]"
                  required
                ></v-text-field>
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
            @click="closeUserDialog"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            @click="saveUser" 
            :disabled="!userFormValid"
            :loading="saving"
            prepend-icon="mdi-check"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de changement de rôle -->
    <v-dialog v-model="roleDialog" max-width="400px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="warning" class="mr-3">mdi-shield-edit</v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">Changer le rôle</h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-select
            v-model="newRole"
            :items="roleSelectOptions"
            label="Nouveau rôle"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-shield-account"
            :rules="[rules.required]"
          ></v-select>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="roleDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="warning" 
            variant="elevated"
            @click="updateUserRole"
            :loading="saving"
          >
            Changer le rôle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de réinitialisation de mot de passe -->
    <v-dialog v-model="passwordDialog" max-width="400px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="orange" class="mr-3">mdi-key-variant</v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">Réinitialiser le mot de passe</h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-text-field
            v-model="newPassword"
            label="Nouveau mot de passe"
            type="password"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock"
            :rules="[rules.required, rules.minLength]"
            hint="Le mot de passe doit contenir au moins 6 caractères"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="passwordDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="orange" 
            variant="elevated"
            @click="updatePassword"
            :loading="saving"
          >
            Réinitialiser
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de visualisation des détails -->
    <v-dialog v-model="viewDialog" max-width="500px">
      <v-card class="rounded-lg" v-if="selectedUser">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-avatar 
              :color="getRoleColor(selectedUser.role)" 
              size="60" 
              class="mr-4"
            >
              <v-icon color="white" size="30">{{ getRoleIcon(selectedUser.role) }}</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ selectedUser.firstName }} {{ selectedUser.lastName }}
              </h3>
              <v-chip
                :color="getRoleColor(selectedUser.role)"
                size="small"
                variant="flat"
                :prepend-icon="getRoleIcon(selectedUser.role)"
                class="mt-1"
              >
                {{ getRoleLabel(selectedUser.role) }}
              </v-chip>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12">
              <h4 class="text-h6 font-weight-medium mb-3">
                <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                Informations de connexion
              </h4>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-email</v-icon>
                  </template>
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.email }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-account-circle</v-icon>
                  </template>
                  <v-list-item-title>Login</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.login }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Créé le</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedUser.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="viewDialog = false"
            prepend-icon="mdi-close"
          >
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="error" class="mr-3">mdi-delete-alert</v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">Confirmation de suppression</h3>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            Êtes-vous sûr de vouloir supprimer l'utilisateur 
            <strong>{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}</strong> ?
          </p>
          <v-alert type="warning" variant="tonal" class="mb-0">
            Cette action est irréversible et supprimera définitivement le compte utilisateur.
          </v-alert>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="deleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            @click="deleteUser"
            :loading="saving"
          >
            Supprimer
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
const users = ref([]);
const search = ref('');
const selectedRole = ref(null);
const currentUser = ref(null);

// Statistiques
const totalUsers = ref(0);
const totalProfessors = ref(0);
const totalAdmins = ref(0);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Dialogs
const userDialog = ref(false);
const roleDialog = ref(false);
const passwordDialog = ref(false);
const viewDialog = ref(false);
const deleteDialog = ref(false);

// Formulaires
const isEditing = ref(false);
const userFormValid = ref(false);
const userFormData = ref({
  firstName: '',
  lastName: '',
  email: '',
  login: '',
  password: '',
  role: 'professor'
});

// Sélections
const selectedUser = ref(null);
const userToDelete = ref(null);
const newRole = ref('');
const newPassword = ref('');

// Options
const roleOptions = ref([
  { title: 'Tous les rôles', value: null },
  { title: 'Administrateur', value: 'admin' },
  { title: 'Professeur', value: 'professor' }
]);

const roleSelectOptions = ref([
  { title: 'Administrateur', value: 'admin' },
  { title: 'Professeur', value: 'professor' }
]);

// En-têtes du tableau
const headers = ref([
  { title: 'Utilisateur', align: 'start', key: 'fullName', sortable: false },
  { title: 'Login', align: 'start', key: 'login' },
  { title: 'Rôle', align: 'start', key: 'role' },
  { title: 'Date de création', align: 'start', key: 'createdAt' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  email: v => /.+@.+\..+/.test(v) || 'Email invalide',
  minLength: v => v.length >= 6 || 'Au moins 6 caractères requis'
};

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Debounce pour la recherche
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers();
  }, 500);
};

// Chargement des données au montage
onMounted(async () => {
  await loadCurrentUser();
  await loadUsers();
  await loadStatistics();
});

// Méthodes utilitaires
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'warning';
    case 'professor': return 'success';
    default: return 'grey';
  }
};

const getRoleIcon = (role) => {
  switch (role) {
    case 'admin': return 'mdi-shield-crown';
    case 'professor': return 'mdi-school';
    default: return 'mdi-account';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'admin': return 'Administrateur';
    case 'professor': return 'Professeur';
    default: return role;
  }
};

// Méthodes de chargement des données
const loadCurrentUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser.value = data;
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil utilisateur:', error);
  }
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.value.page);
    queryParams.append('limit', pagination.value.limit);
    
    if (search.value) queryParams.append('search', search.value);
    if (selectedRole.value) queryParams.append('role', selectedRole.value);

    const response = await fetch(`http://localhost:5000/api/auth/users/search?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des utilisateurs');
    }

    const data = await response.json();
    users.value = data.users || [];
    
    if (data.pagination) {
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des utilisateurs',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    // Charger tous les utilisateurs pour les statistiques
    const response = await fetch('http://localhost:5000/api/auth/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const allUsers = await response.json();
      totalUsers.value = allUsers.length;
      totalProfessors.value = allUsers.filter(user => user.role === 'professor').length;
      totalAdmins.value = allUsers.filter(user => user.role === 'admin').length;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
  }
};

// Méthodes de gestion du tableau
const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadUsers();
};

// Méthodes de gestion des dialogs
const openAddUserDialog = () => {
  isEditing.value = false;
  resetUserForm();
  userDialog.value = true;
};

const viewUser = (user) => {
  selectedUser.value = user;
  viewDialog.value = true;
};

const editUser = (user) => {
  isEditing.value = true;
  selectedUser.value = user;
  userFormData.value = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    login: user.login,
    role: user.role,
    password: ''
  };
  userDialog.value = true;
};

const changeUserRole = (user) => {
  if (user._id === currentUser.value?._id) {
    snackbar.value = {
      show: true,
      text: 'Vous ne pouvez pas modifier votre propre rôle',
      color: 'warning'
    };
    return;
  }
  selectedUser.value = user;
  newRole.value = user.role;
  roleDialog.value = true;
};

const resetPassword = (user) => {
  selectedUser.value = user;
  newPassword.value = '';
  passwordDialog.value = true;
};

const confirmDelete = (user) => {
  if (user._id === currentUser.value?._id) {
    snackbar.value = {
      show: true,
      text: 'Vous ne pouvez pas supprimer votre propre compte',
      color: 'warning'
    };
    return;
  }
  userToDelete.value = user;
  deleteDialog.value = true;
};

const closeUserDialog = () => {
  userDialog.value = false;
  resetUserForm();
};

const resetUserForm = () => {
  userFormData.value = {
    firstName: '',
    lastName: '',
    email: '',
    login: '',
    password: '',
    role: 'professor'
  };
  selectedUser.value = null;
};

// Méthodes CRUD
const saveUser = async () => {
  if (!userFormValid.value) return;
  
  saving.value = true;
  try {
    const url = isEditing.value 
      ? `http://localhost:5000/api/auth/users/${selectedUser.value._id}`
      : 'http://localhost:5000/api/auth/register';
    
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const body = isEditing.value 
      ? {
          firstName: userFormData.value.firstName,
          lastName: userFormData.value.lastName,
          email: userFormData.value.email,
          login: userFormData.value.login
        }
      : userFormData.value;

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
    }

    snackbar.value = {
      show: true,
      text: `Utilisateur ${isEditing.value ? 'modifié' : 'créé'} avec succès`,
      color: 'success'
    };

    closeUserDialog();
    await loadUsers();
    await loadStatistics();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || `Erreur lors de la ${isEditing.value ? 'modification' : 'création'} de l'utilisateur`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const updateUserRole = async () => {
  if (!selectedUser.value || !newRole.value) return;
  
  saving.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/auth/users/${selectedUser.value._id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ role: newRole.value })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la modification du rôle');
    }

    snackbar.value = {
      show: true,
      text: 'Rôle modifié avec succès',
      color: 'success'
    };

    roleDialog.value = false;
    await loadUsers();
    await loadStatistics();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la modification du rôle',
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const updatePassword = async () => {
  if (!selectedUser.value || !newPassword.value) return;
  
  saving.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/auth/users/${selectedUser.value._id}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ newPassword: newPassword.value })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la réinitialisation du mot de passe');
    }

    snackbar.value = {
      show: true,
      text: 'Mot de passe réinitialisé avec succès',
      color: 'success'
    };

    passwordDialog.value = false;
    newPassword.value = '';
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la réinitialisation du mot de passe',
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  saving.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/auth/users/${userToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression');
    }

    snackbar.value = {
      show: true,
      text: 'Utilisateur supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    await loadUsers();
    await loadStatistics();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la suppression de l\'utilisateur',
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
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

.v-avatar {
  transition: all 0.2s ease;
}

.v-avatar:hover {
  transform: scale(1.05);
}

.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}

.rounded-lg {
  border-radius: 12px !important;
}

.elevation-3 {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1) !important;
}



/* Personnalisation du theme sombre */
.v-theme--dark .v-card {
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(10px);
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
