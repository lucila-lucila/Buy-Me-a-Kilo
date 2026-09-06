import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** Valores por defecto del contador en desarrollo. Sobre el umbral de 50 kg. */
const DEV_TOTAL = 214
const DEV_WEEK = 6

/**
 * Stand-in de las funciones de Vercel para poder trabajar sin KV.
 *
 * Solo corre en `vite dev` (apply: 'serve'), así que no existe en el build ni
 * puede llegar a producción. Los valores se pisan desde la URL de la página:
 *
 *   /                 214 kg totales, 6 de la semana
 *   /?kg=1204         cambia el total
 *   /?week=3          cambia la semana
 *   /?over            fuerza OVERWEIGHT (semana por encima de la meta)
 *   /?kg=12           por debajo del umbral: el número grande no se muestra
 *
 * /api/serial devuelve una serie que arranca en 217 y sube en cada revelación.
 *
 * El override se lee del Referer, que es la URL de la página que hizo el fetch.
 * Así el cliente no necesita una sola línea de código de desarrollo.
 */
function mockApi(): Plugin {
  let devSerial = 216
  return {
    name: 'bmak-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')

        // /open sin extensión, igual que en producción vía vercel.json.
        if (url.pathname === '/open') {
          req.url = '/open.html' + url.search
          return next()
        }

        if (url.pathname === '/api/kilos') {
          const page = new URL(req.headers.referer ?? url.href, 'http://localhost')
          const q = page.searchParams
          const num = (key: string, fallback: number) => {
            const raw = q.get(key)
            const n = raw === null ? NaN : Number(raw)
            return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback
          }
          const total = num('kg', DEV_TOTAL)
          const week = q.has('over') ? num('week', 14) : num('week', DEV_WEEK)

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ total, week }))
          return
        }

        if (url.pathname === '/api/serial') {
          devSerial += 1
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ serial: devSerial }))
          return
        }

        if (url.pathname === '/api/share') {
          console.log('[mock] share_generated +1')
          res.statusCode = 204
          res.end()
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockApi()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        open: resolve(__dirname, 'open.html'),
      },
    },
  },
  server: { port: 5173 },
})
