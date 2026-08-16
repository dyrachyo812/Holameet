import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const backendOrigin = `http://localhost:${env.BACKEND_PORT || 3000}`

  return {
    plugins: [react(), tailwindcss()],
    envDir: '..',
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
      proxy: {
        '/auth': backendOrigin,
        '/me': backendOrigin,
        '/health': backendOrigin,
        '/public': backendOrigin,
      },
    },
  }
})
