<template>
  <div class="register">
    <!-- Image de fond en plein écran -->
    <img src="/images/logos/background-pattern.png" alt="Background" class="fullscreen-background" />
    
    <div class="register__header">
      <img src="/images/logos/logo-university.png" alt="Logo Université" class="register__logo" />
    </div>

    <v-card class="register__card" elevation="3">
      <v-card-title class="register__title">Créer un nouveau compte</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="register">
          <!-- Message d'erreur -->
          <v-alert
            v-if="showError"
            type="error"
            variant="tonal"
            closable
            class="register__alert"
            @click:close="showError = false"
          >
            {{ errorMsg }}
          </v-alert>

          <!-- Message de succès -->
          <v-alert
            v-if="showSuccess"
            type="success"
            variant="tonal"
            class="register__alert"
          >
            ✅ Inscription réussie ! Redirection vers la page de connexion dans 3 secondes...
          </v-alert>
          
          <v-text-field
            v-model="firstName"
            label="Prénom"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            color="primary"
            autocomplete="given-name"
            class="register__input"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="lastName"
            label="Nom de famille"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            color="primary"
            autocomplete="family-name"
            class="register__input"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="email"
            label="Adresse email"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            color="primary"
            type="email"
            autocomplete="email"
            class="register__input"
            :rules="[rules.required, rules.email]"
            required
          />
          
          <v-text-field
            v-model="login"
            label="Nom d'utilisateur"
            prepend-inner-icon="mdi-account-circle"
            variant="outlined"
            color="primary"
            autocomplete="username"
            class="register__input"
            :rules="[rules.required]"
            required
          />
          
          <v-text-field
            v-model="password"
            label="Mot de passe"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            type="password"
            color="primary"
            autocomplete="new-password"
            class="register__input"
            :rules="[rules.required, rules.minLength]"
            required
          />

          <v-text-field
            v-model="confirmPassword"
            label="Confirmer le mot de passe"
            prepend-inner-icon="mdi-lock-check"
            variant="outlined"
            type="password"
            color="primary"
            autocomplete="new-password"
            class="register__input"
            :rules="[rules.required, rules.passwordMatch]"
            required
          />
          
          <v-btn
            type="submit"
            color="error"
            block
            class="register__btn text-white"
            size="large"
            :loading="loading"
            :disabled="!isFormValid"
            @click.prevent="register"
          >
            <v-icon start>mdi-account-plus</v-icon>
            S'inscrire
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="register__actions">
        <v-btn
          variant="text"
          color="primary"
          class="text-caption"
          @click="goToLogin"
        >
          Déjà un compte ? Se connecter
        </v-btn>
        
        <v-btn variant="text" color="grey" class="text-caption mt-1">
          Aide / Contact
        </v-btn>
      </v-card-actions>
    </v-card>

    <div class="register__footer">
      <span class="register__service-info">
        <v-icon small>mdi-shield-check</v-icon>
        Service d'inscription de l'évaluation
      </span>
      <div class="register__lang-selector">
        <span>FR</span> | <span>EN</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Champs du formulaire
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const login = ref('');
const password = ref('');
const confirmPassword = ref('');

// États de l'interface
const loading = ref(false);
const errorMsg = ref('');
const showError = ref(false);
const showSuccess = ref(false);

const rules = {
  required: value => !!value || 'Ce champ est requis.',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || 'Adresse email invalide.';
  },
  minLength: value => (value && value.length >= 6) || 'Le mot de passe doit contenir au moins 6 caractères.',
  passwordMatch: value => value === password.value || 'Les mots de passe ne correspondent pas.',
};

const isFormValid = computed(() => {
  const firstNameValid = firstName.value && firstName.value.trim().length > 0;
  const lastNameValid = lastName.value && lastName.value.trim().length > 0;
  const emailValid = email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const loginValid = login.value && login.value.trim().length > 0;
  const passwordValid = password.value && password.value.length >= 6;
  const confirmPasswordValid = confirmPassword.value && confirmPassword.value === password.value;
  
  return firstNameValid && lastNameValid && emailValid && loginValid && passwordValid && confirmPasswordValid;
});

const register = async () => {
  if (!isFormValid.value) return;

  errorMsg.value = '';
  showError.value = false;
  showSuccess.value = false;
  loading.value = true;
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        login: login.value,
        password: password.value,
        role: 'professor' // Rôle par défaut
      })
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Échec de l'inscription.");
    }
    
    showSuccess.value = true;
    
    // Réinitialiser le formulaire après succès
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    login.value = '';
    password.value = '';
    confirmPassword.value = '';
    
    // Redirection automatique vers login après 3 secondes
    setTimeout(() => {
      router.push('/login');
    }, 3000);

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    errorMsg.value = error.message || "Une erreur est survenue. Veuillez réessayer.";
    showError.value = true;
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.fullscreen-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  object-fit: cover;
}

.register__header {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  justify-content: flex-start;
}

.register__logo {
  height: 80px;
}

.register__card {
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.register__title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.register__input {
  background-color: #ffffff !important;
  margin-bottom: 1rem;
}

.register__btn {
  font-weight: 500;
  letter-spacing: 1px;
  height: 48px !important;
}

.register__actions {
  justify-content: center;
  flex-direction: column;
}

.register__footer {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 0.8rem;
  padding: 0 20px;
}

.register__service-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.register__lang-selector {
  cursor: pointer;
}

.register__alert {
  margin-bottom: 1rem;
}

/* Styles globaux pour la page d'inscription */
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

html, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
}
</style>
