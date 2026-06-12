import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** GitHub Pages project site: https://grigormkr.github.io/NagaevoMaster/ */
const pagesBase = '/NagaevoMaster/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? pagesBase : '/',
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: (className, filePath) => {
        const moduleName = path.basename(filePath).replace(/\.module\.css$/, '')
        return `${moduleName}__${className}`
      },
    },
  },
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
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}))
