import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server : {
    cors : {
      origin: 'http://192.168.0.158:5000' //aqui va la ip de el servidor
    }
  }
})
