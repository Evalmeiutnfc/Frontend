import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify' // 👈 à ajouter

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }) // 👈 à ajouter
  ],
})
