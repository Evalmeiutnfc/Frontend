<template>
  <v-container fluid class="pa-4">
    <!-- En-tête -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-account-circle
              </v-icon>
              Mon profil
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Gérez vos informations personnelles et paramètres de compte
            </p>
          </div>
          <v-chip
            :color="userProfile?.role === 'admin' ? 'error' : 'primary'"
            size="large"
            variant="flat"
            prepend-icon="mdi-shield-account"
          >
            {{ getRoleLabel(userProfile?.role) }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Informations du profil -->
      <v-col cols="12" lg="8">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="primary" class="mr-3">mdi-account-edit</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Informations personnelles</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Modifiez vos données de profil</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="profileForm" v-model="profileFormValid" @submit.prevent="updateProfile">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileData.firstName"
                    label="Prénom"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required]"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileData.lastName"
                    label="Nom"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required]"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="profileData.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-email"
                    :rules="[rules.required, rules.email]"
                    required
                  />
                </v-col>
              </v-row>
              
              <div class="d-flex justify-end gap-2 mt-4">
                <v-btn
                  color="grey-darken-1"
                  variant="outlined"
                  @click="resetProfileForm"
                  :disabled="updatingProfile"
                >
                  Annuler
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  type="submit"
                  :loading="updatingProfile"
                  :disabled="!profileFormValid || !hasProfileChanges"
                  prepend-icon="mdi-check"
                >
                  Enregistrer
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Informations du compte -->
      <v-col cols="12" lg="4">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="info" class="mr-3">mdi-information</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Informations du compte</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Détails de votre compte</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <div class="mb-4">
              <div class="text-center mb-4">
                <v-avatar size="80" :color="userProfile?.role === 'admin' ? 'error' : 'primary'">
                  <span class="text-h4 text-white">
                    {{ getInitials(userProfile?.firstName, userProfile?.lastName) }}
                  </span>
                </v-avatar>
              </div>
              
              <div class="text-center mb-4">
                <h4 class="text-h6 font-weight-bold">
                  {{ userProfile?.firstName }} {{ userProfile?.lastName }}
                </h4>
                <p class="text-body-2 text-medium-emphasis">{{ userProfile?.email }}</p>
              </div>
              
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-shield-account</v-icon>
                  </template>
                  <v-list-item-title>Rôle</v-list-item-title>
                  <v-list-item-subtitle>{{ getRoleLabel(userProfile?.role) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-calendar-plus</v-icon>
                  </template>
                  <v-list-item-title>Membre depuis</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(userProfile?.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-update</v-icon>
                  </template>
                  <v-list-item-title>Dernière modification</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(userProfile?.updatedAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Changement de mot de passe -->
    <v-row class="mt-6">
      <v-col cols="12" lg="6">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="warning" class="mr-3">mdi-lock-reset</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Changer le mot de passe</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Modifiez votre mot de passe</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-form ref="passwordForm" v-model="passwordFormValid" @submit.prevent="changePassword">
              <v-text-field
                v-model="passwordData.currentPassword"
                label="Mot de passe actuel"
                type="password"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-lock"
                :rules="[rules.required]"
                required
                class="mb-4"
              />
              
              <v-text-field
                v-model="passwordData.newPassword"
                label="Nouveau mot de passe"
                type="password"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-lock-plus"
                :rules="[rules.required, rules.minLength]"
                required
                class="mb-4"
              />
              
              <v-text-field
                v-model="passwordData.confirmPassword"
                label="Confirmer le nouveau mot de passe"
                type="password"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-lock-check"
                :rules="[rules.required, rules.passwordMatch]"
                required
                class="mb-4"
              />
              
              <div class="d-flex justify-end gap-2">
                <v-btn
                  color="grey-darken-1"
                  variant="outlined"
                  @click="resetPasswordForm"
                  :disabled="changingPassword"
                >
                  Annuler
                </v-btn>
                <v-btn
                  color="warning"
                  variant="elevated"
                  type="submit"
                  :loading="changingPassword"
                  :disabled="!passwordFormValid"
                  prepend-icon="mdi-lock-reset"
                >
                  Changer
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Zone de danger -->
      <v-col cols="12" lg="6">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-title class="pa-6 pb-4">
            <div class="d-flex align-center">
              <v-icon size="large" color="error" class="mr-3">mdi-alert-octagon</v-icon>
              <div>
                <h3 class="text-h6 font-weight-bold">Zone de danger</h3>
                <p class="text-subtitle-2 text-medium-emphasis mb-0">Actions irréversibles</p>
              </div>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-6">
            <v-alert
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <v-icon class="mr-2">mdi-information</v-icon>
              La suppression de votre compte est définitive et irréversible.
            </v-alert>
            
            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="mdi-delete-forever"
              @click="confirmDeleteDialog = true"
              block
            >
              Supprimer mon compte
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="confirmDeleteDialog" max-width="500px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="error" class="mr-3">mdi-alert-circle</v-icon>
            <div>
              <h3 class="text-h6 font-weight-bold">Confirmer la suppression</h3>
              <p class="text-subtitle-2 text-medium-emphasis mb-0">Cette action est irréversible</p>
            </div>
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-alert
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <strong>Attention !</strong> Vous êtes sur le point de supprimer définitivement votre compte.
          </v-alert>
          
          <p class="text-body-2 mb-4">
            Pour confirmer la suppression, veuillez saisir votre mot de passe :
          </p>
          
          <v-form ref="deleteForm" v-model="deleteFormValid" @submit.prevent="deleteAccount">
            <v-text-field
              v-model="deleteData.password"
              label="Mot de passe"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock"
              :rules="[rules.required]"
              required
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6">
          <v-btn
            color="grey-darken-1"
            variant="outlined"
            @click="cancelDelete"
            :disabled="deletingAccount"
          >
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteAccount"
            :loading="deletingAccount"
            :disabled="!deleteFormValid"
            prepend-icon="mdi-delete-forever"
          >
            Supprimer définitivement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar pour les notifications -->
    <v-snackbar
      v-model="notification.show"
      :color="notification.color"
      timeout="5000"
      location="top right"
    >
      {{ notification.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="notification.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// État de la page
const loading = ref(false);
const updatingProfile = ref(false);
const changingPassword = ref(false);
const deletingAccount = ref(false);

// Données utilisateur
const userProfile = ref(null);
const originalProfileData = ref({});

// Formulaires
const profileForm = ref(null);
const passwordForm = ref(null);
const deleteForm = ref(null);

// Validité des formulaires
const profileFormValid = ref(false);
const passwordFormValid = ref(false);
const deleteFormValid = ref(false);

// Données des formulaires
const profileData = ref({
  firstName: '',
  lastName: '',
  email: ''
});

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const deleteData = ref({
  password: ''
});

// Dialogs
const confirmDeleteDialog = ref(false);

// Notifications
const notification = ref({
  show: false,
  text: '',
  color: 'success'
});

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  email: v => /.+@.+\..+/.test(v) || 'Email invalide',
  minLength: v => (v && v.length >= 6) || 'Minimum 6 caractères',
  passwordMatch: v => v === passwordData.value.newPassword || 'Les mots de passe ne correspondent pas'
};

// Computed properties
const hasProfileChanges = computed(() => {
  return (
    profileData.value.firstName !== originalProfileData.value.firstName ||
    profileData.value.lastName !== originalProfileData.value.lastName ||
    profileData.value.email !== originalProfileData.value.email
  );
});

// Méthodes utilitaires
const showNotification = (text, color = 'success') => {
  notification.value = { show: true, text, color };
};

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrateur',
    professor: 'Professeur'
  };
  return labels[role] || 'Utilisateur';
};

const getInitials = (firstName, lastName) => {
  if (!firstName || !lastName) return '??';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Fonctions de chargement
const loadUserProfile = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      userProfile.value = await response.json();
      
      // Initialiser les données du formulaire
      profileData.value = {
        firstName: userProfile.value.firstName,
        lastName: userProfile.value.lastName,
        email: userProfile.value.email
      };
      
      originalProfileData.value = { ...profileData.value };
    } else {
      throw new Error('Erreur lors du chargement du profil');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur lors du chargement du profil', 'error');
  } finally {
    loading.value = false;
  }
};

// Fonctions de mise à jour
const updateProfile = async () => {
  if (!profileForm.value) return;

  const { valid } = await profileForm.value.validate();
  if (!valid) return;

  updatingProfile.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData.value)
    });

    if (response.ok) {
      const data = await response.json();
      userProfile.value = data.user;
      originalProfileData.value = { ...profileData.value };
      showNotification('Profil mis à jour avec succès !', 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(error.message, 'error');
  } finally {
    updatingProfile.value = false;
  }
};

const changePassword = async () => {
  if (!passwordForm.value) return;

  const { valid } = await passwordForm.value.validate();
  if (!valid) return;

  changingPassword.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: passwordData.value.currentPassword,
        newPassword: passwordData.value.newPassword
      })
    });

    if (response.ok) {
      showNotification('Mot de passe modifié avec succès !', 'success');
      resetPasswordForm();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(error.message, 'error');
  } finally {
    changingPassword.value = false;
  }
};

const deleteAccount = async () => {
  if (!deleteForm.value) return;

  const { valid } = await deleteForm.value.validate();
  if (!valid) return;

  deletingAccount.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: deleteData.value.password
      })
    });

    if (response.ok) {
      showNotification('Compte supprimé avec succès', 'success');
      
      // Déconnexion et redirection
      localStorage.removeItem('token');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(error.message, 'error');
  } finally {
    deletingAccount.value = false;
  }
};

// Fonctions de réinitialisation
const resetProfileForm = () => {
  profileData.value = { ...originalProfileData.value };
  if (profileForm.value) {
    profileForm.value.resetValidation();
  }
};

const resetPasswordForm = () => {
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  if (passwordForm.value) {
    passwordForm.value.resetValidation();
  }
};

const cancelDelete = () => {
  confirmDeleteDialog.value = false;
  deleteData.value.password = '';
  if (deleteForm.value) {
    deleteForm.value.resetValidation();
  }
};

// Chargement initial
onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.elevation-3 {
  box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12) !important;
}

@media (max-width: 1024px) {
  .v-container {
    padding: 8px !important;
  }
}

@media (max-width: 768px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }
  
  .d-flex.gap-2 {
    width: 100%;
  }
  
  .d-flex.gap-2 .v-btn {
    flex: 1;
  }
}
</style>
