import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Bind mount do Docker Desktop no Windows não propaga eventos de
      // arquivo de forma confiável para o container — polling garante que
      // o HMR sempre pegue as mudanças feitas no host.
      usePolling: true,
      interval: 300,
    },
  },
})
