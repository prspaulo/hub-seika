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
  preview: {
    host: true,
    // Vite valida o header Host contra uma allowlist (proteção a DNS
    // rebinding) — sem isso, o domínio dinâmico que o proxy do Railway usa
    // (ex: *.up.railway.app) é rejeitado com "Blocked request".
    allowedHosts: true,
  },
})
