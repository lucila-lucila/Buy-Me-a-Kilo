// Sirve dist/ con EXACTAMENTE las cabeceras de vercel.json, para probar la CSP
// con la página cargada y el juego andando. /api/kilos devuelve un JSON fijo.
import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
const v = JSON.parse(readFileSync('vercel.json', 'utf8'))
const seg = v.headers.find(h => h.source === '/(.*)').headers
const tipos = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain', '.json':'application/json', '.svg':'image/svg+xml' }
const g = Number(process.env.GRAMOS ?? 1309)
http.createServer((req, res) => {
  for (const h of seg) res.setHeader(h.key, h.value)
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/api/kilos') {
    const grams = g, people = 289
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ gramsTotal: grams, kilosTotal: Math.round(grams/100)/10, capacityKilos: 23, peopleTotal: people, percentFull: Math.round(grams/230)/10, daysRemaining: 38, msRemaining: 38*86400000, departureIso: '2026-10-26T03:00:00.000Z', departed: false }))
  }
  let p = url.pathname === '/' ? '/index.html' : url.pathname === '/open' ? '/open.html' : url.pathname
  let f = join('dist', p)
  if (!existsSync(f) || statSync(f).isDirectory()) { res.statusCode = 404; return res.end('no') }
  res.setHeader('Content-Type', tipos[extname(f)] ?? 'application/octet-stream')
  res.end(readFileSync(f))
}).listen(4174, () => console.log('csp-server en 4174 con', seg.length, 'cabeceras'))
