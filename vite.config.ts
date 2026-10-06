/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tuningApi } from './src/dev/tuningPlugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), tuningApi()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Тесты обязаны проверять ту же игру, в которую играет человек,
    // поэтому правки админки применяются и здесь.
    setupFiles: ['./src/content/tuning.ts'],
  },
})
