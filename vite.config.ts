import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** Arrastre inicial, igual que el default del servidor. */
const DEV_GRAMS = 1309
const DEV_PEOPLE = 289
const CAPACITY_G = 23_000
const DEV_DEPARTURE = '2026-10-11T00:00:00-03:00'

/**
 * Stand-in de las funciones de Vercel para poder trabajar sin KV.
 *
 * Solo corre en `vite dev` (apply: 'serve'), así que no existe en el build ni
 * puede llegar a producción. Los valores se pisan desde la URL de la página:
 *
 *   /                 1309 g, 5.7% de la valija
 *   /?g=11500         cambia los gramos (11500 = mitad de la valija)
 *   /?people=800      cambia la cantidad de personas
 *   /?days=3          cambia la cuenta regresiva
 *   /?overweight      pasada de 23 kilos
 *   /?departed        el avión ya salió
 *
 * El override se lee del Referer, que es la URL de la página que hizo el fetch.
 * Así el cliente no necesita una sola línea de código de desarrollo.
 */
function mockApi(): Plugin {
  let devSerial = 216
  const round1 = (n: number) => Math.round(n * 10) / 10

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
          const q = new URL(req.headers.referer ?? url.href, 'http://localhost').searchParams
          const num = (key: string, fallback: number) => {
            const raw = q.get(key)
            const n = raw === null ? NaN : Number(raw)
            return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback
          }

          const gramsTotal = q.has('overweight') ? 24_100 : num('g', DEV_GRAMS)
          const realDays = Math.max(
            0,
            Math.ceil((new Date(DEV_DEPARTURE).getTime() - Date.now()) / 86_400_000),
          )
          const days = q.has('departed') ? 0 : num('days', realDays)

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(
            JSON.stringify({
              gramsTotal,
              kilosTotal: round1(gramsTotal / 1000),
              capacityKilos: CAPACITY_G / 1000,
              peopleTotal: num('people', DEV_PEOPLE),
              percentFull: round1((gramsTotal / CAPACITY_G) * 100),
              daysRemaining: days,
              departed: days <= 0,
            }),
          )
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
