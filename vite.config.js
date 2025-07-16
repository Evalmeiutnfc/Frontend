import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify' // 👈 à ajouter

export default defineConfig({
  base: '/Frontend/', // Remplacez <nom-du-repo> par le nom de votre dépôt GitHub
  plugins: [
    vue(),
    vuetify({ autoImport: true }) // 👈 à ajouter
  ],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Améliorer la gestion des chunks
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          vuetify: ['vuetify']
        }
      }
    }
  }
})
