<template>
  <div class="register-page">
    <!-- Header avec logo -->
    <div class="register-header">
      <img src="/images/logos/logo-university.png" alt="Logo Université" class="university-logo" />
    </div>
    
    <!-- Formulaire d'inscription -->
    <v-card class="register-card" elevation="3">
      <v-card-title class="register-title">Créer un nouveau compte</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="register">
          <!-- Message d'erreur -->
          <v-alert
            v-if="showError"
            type="error"
            variant="tonal"
            closable
            class="mb-4"
            @click:close="showError = false"
          >
            {{ errorMsg }}
          </v-alert>

          <!-- Message de succès -->
          <v-alert
            v-if="showSuccess"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            Inscription réussie ! Vous pouvez maintenant vous <router-link to="/login">connecter</router-link>.
          </v-alert>
          
          <v-text-field
            v-model="username"
            label="Nom d'utilisateur"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            color="primary"
            :bg-color="'white'"
            class="mb-2"
            :rules="[rules.required]"
          />
          
          <v-text-field
            v-model="password"
            label="Mot de passe"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            type="password"
            color="primary"
            :bg-color="'white'"
            class="mb-4"
            :rules="[rules.required, rules.minLength]"
          />

          <v-text-field
            v-model="confirmPassword"
            label="Confirmer le mot de passe"
            prepend-inner-icon="mdi-lock-check"
            variant="outlined"
            type="password"
            color="primary"
            :bg-color="'white'"
            class="mb-4"
            :rules="[rules.required, rules.passwordMatch]"
          />
          
          <v-btn
            type="submit"
            color="primary"
            block
            class="register-btn text-white"
            size="large"
            :loading="loading"
            :disabled="!isFormValid"
          >
            <v-icon start>mdi-account-plus</v-icon>
            S'inscrire
          </v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn variant="text" color="grey" to="/login" class="text-caption">
          Déjà un compte ? Se connecter
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Footer -->
    <div class="register-footer">
      <span class="service-info">
        <v-icon small>mdi-shield-check</v-icon>
        Service d'inscription de l'évaluation
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMsg = ref('');
const showError = ref(false);
const showSuccess = ref(false);

const rules = {
  required: value => !!value || 'Ce champ est requis.',
  minLength: value => (value && value.length >= 6) || 'Le mot de passe doit contenir au moins 6 caractères.',
  passwordMatch: value => value === password.value || 'Les mots de passe ne correspondent pas.',
};

const isFormValid = computed(() => {
  return username.value && password.value && confirmPassword.value && password.value === confirmPassword.value && password.value.length >= 6;
});

const register = async () => {
  if (!isFormValid.value) return;

  errorMsg.value = '';
  showError.value = false;
  showSuccess.value = false;
  loading.value = true;
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Échec de l'inscription.");
    }
    
    showSuccess.value = true;
    // Optionnel : rediriger après un délai
    // setTimeout(() => router.push('/login'), 3000);

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    errorMsg.value = error.message || "Une erreur est survenue. Veuillez réessayer.";
    showError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: url('/images/logos/background-pattern.png') repeat, linear-gradient(135deg, #2196f3 0%, #ff5722 100%);
  padding: 2rem 1rem;
}

.register-header {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 0 0 2rem 0;
}

.university-logo {
  height: 80px;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  padding: 1rem;
}

.register-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1rem;
}

.register-btn {
  font-weight: 500;
  letter-spacing: 1px;
  height: 48px !important;
}

.register-footer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 0.8rem;
  padding-top: 2rem;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
