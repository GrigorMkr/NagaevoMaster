import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** GitHub Pages: /NagaevoMaster/ · свой домен (REG.RU): VITE_BASE=/ */
const pagesBase = '/NagaevoMaster/'
const buildBase = process.env.VITE_BASE ?? pagesBase

function patchWebManifestPlugin(base: string) {
  return {
    name: 'patch-webmanifest-base',
    closeBundle() {
      const manifestPath = path.resolve('dist/site.webmanifest')
      if (!fs.existsSync(manifestPath)) return

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        id?: string
        scope?: string
        start_url?: string
        icons?: { src: string; sizes: string; type: string; purpose?: string }[]
      }

      const normalizedBase = base.endsWith('/') ? base : `${base}/`
      manifest.id = normalizedBase
      manifest.scope = normalizedBase
      manifest.start_url = normalizedBase
      if (manifest.icons) {
        manifest.icons = manifest.icons.map((icon) => ({
          ...icon,
          src: icon.src.startsWith('/') ? icon.src : `${normalizedBase}${icon.src.replace(/^\.\//, '')}`,
        }))
      }

      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? buildBase : '/',
  plugins: [react(), ...(command === 'build' ? [patchWebManifestPlugin(buildBase)] : [])],
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
