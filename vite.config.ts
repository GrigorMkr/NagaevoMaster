import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** GitHub Pages project site: https://grigormkr.github.io/NagaevoMaster/ */
const pagesBase = '/NagaevoMaster/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? pagesBase : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/news': {
        target: 'https://nagaevodk.ru',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/news/, ''),
      },
    },
  },
}))
