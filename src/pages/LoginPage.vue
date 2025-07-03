<template>
  <div class="login">
    <!-- Image de fond en plein écran -->
    <img src="/images/logos/background-pattern.png" alt="Background" class="fullscreen-background" />
    
    <div class="login__header">
      <img src="/images/logos/logo-university.png" alt="Logo Université" class="login__logo" />
    </div>

    <v-card class="login__card" elevation="3">
      <v-card-title class="login__title">Veuillez vous authentifier</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="login">
          <v-alert
            v-if="showError"
            type="error"
            variant="tonal"
            closable
            class="login__alert"
            @click:close="showError = false"
          >
            {{ errorMsg }}
          </v-alert>

          <v-text-field
            v-model="username"
            label="Nom d'utilisateur"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            color="primary"
            autocomplete="username"
            class="login__input"
            required
          />

          <v-text-field
            v-model="password"
            label="Mot de passe"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            type="password"
            color="primary"
            autocomplete="current-password"
            class="login__input"
            required
          />

          <v-checkbox
            v-model="rememberMe"
            label="Voir mes dernières connexions"
            color="primary"
            class="login__checkbox"
          />

          <v-btn
            type="submit"
            color="error"
            block
            class="login__btn text-white"
            size="large"
            :loading="loading"
          >
            <v-icon start>mdi-login</v-icon>
            Se connecter
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="login__actions">
        <v-btn
          variant="text"
          color="primary"
          class="text-caption"
          @click="router.push('/register')"
        >
          Créer un compte
        </v-btn>
        <v-btn variant="text" color="grey" class="text-caption mt-1">
          Aide / Contact / Perte de mot de passe
        </v-btn>
      </v-card-actions>
    </v-card>

    <div class="login__footer">
      <span class="login__service-info">
        <v-icon small>mdi-shield-check</v-icon>
        Service authentification de l'évaluation
      </span>
      <div class="login__lang-selector">
        <span>FR</span> | <span>EN</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const errorMsg = ref('');
const showError = ref(false);

const login = async () => {
  errorMsg.value = '';
  showError.value = false;
  loading.value = true;

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: username.value, // Correction ici
        password: password.value
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Échec de l'authentification");
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/dashboard');
  } catch (error) {
    errorMsg.value = error.message || "Erreur inconnue";
    showError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.login__header {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  justify-content: flex-start;
}

.login__logo {
  height: 80px;
}

.login__card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login__title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.login__input {
  background-color: #ffffff !important;
  margin-bottom: 1rem;
}

.login__checkbox {
  margin-bottom: 1rem;
}

.login__btn {
  font-weight: 500;
  letter-spacing: 1px;
  height: 48px !important;
}

.login__actions {
  justify-content: center;
  flex-direction: column;
}

.login__footer {
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

.login__service-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login__lang-selector {
  cursor: pointer;
}

.login__alert {
  margin-bottom: 1rem;
}

/* Styles globaux */
body {
  margin: 0; /* Supprime les marges globales */
  padding: 0; /* Supprime les paddings globaux */
  height: 100vh;
  overflow: hidden; /* Supprime complètement le scroll */
}

html, #app {
  height: 100%; /* Assure une hauteur pleine */
  width: 100%; /* Assure une largeur pleine */
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
}
</style>
