import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** GitHub Pages project site: https://grigormkr.github.io/NagaevoMaster/ */
const pagesBase = '/NagaevoMaster/'

function patchWebManifestPlugin(base: string) {
  return {
    name: 'patch-webmanifest-base',
    closeBundle() {
      const manifestPath = path.resolve('dist/site.webmanifest')
      if (!fs.existsSync(manifestPath)) return

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        start_url?: string
        icons?: { src: string; sizes: string; type: string }[]
      }

      manifest.start_url = base
      if (manifest.icons) {
        manifest.icons = manifest.icons.map((icon) => ({
          ...icon,
          src: icon.src.startsWith('/') ? icon.src : `${base}${icon.src}`,
        }))
      }

      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? pagesBase : '/',
  plugins: [react(), ...(command === 'build' ? [patchWebManifestPlugin(pagesBase)] : [])],
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
