import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/keycloak-debug/',
  server: {
    port: 3000,
  },
})
