import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const pagina = (nome: string) => fileURLToPath(new URL(nome, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
  build: {
    rollupOptions: {
      // Duas páginas: a entrada (/) e o controle da lâmpada (/luz).
      input: { inicio: pagina('index.html'), luz: pagina('luz.html') },
    },
  },
})
