import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    // Necesario para desplegar en Railway (u otro host detras de un
    // proxy): el dominio publico que asigna la plataforma no se conoce
    // de antemano, y por defecto "vite preview" rechaza requests con un
    // header Host que no reconoce (proteccion contra DNS rebinding).
    allowedHosts: true,
  },
})
