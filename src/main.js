import { createApp } from 'vue'
import './style.css'
import './assets/css/global.css' // Import des styles globaux pour supprimer les marges et le scroll
import './assets/css/login.css' // Import des styles spécifiques pour la page login
import App from './App.vue'
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import router from './router';

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
});

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')
