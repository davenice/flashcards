import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/flashcards/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
})
