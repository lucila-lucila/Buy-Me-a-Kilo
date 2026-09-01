#!/usr/bin/env node
/**
 * Verifica que nada de la capa de economía haya terminado en dist/.
 *
 * Corre en postbuild y falla el build si encuentra algo. No es cosmético: Vite
 * inlina en el bundle cualquier cosa que un módulo de src/ importe, así que un
 * import descuidado desde un componente publicaría la tabla de precios entera.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = 'dist'

/** Identificadores y nombres de env var que solo pueden vivir en /api. */
const FORBIDDEN = [
  'TIER_PRICE_CENTS',
  'AMOUNT_LADDER',
  'EXPECTED_MIX',
  'EXPECTED_NET_TICKET',
  'OVERWEIGHT_SHIPPING_CENTS',
  'PAYPAL_FIXED_CENTS',
  'PAYPAL_PCT',
  'KOFI_PCT',
  'KOFI_VERIFICATION_TOKEN',
  'STATS_SECRET',
  'TARGET_FLOOR_WEEKLY',
  'TARGET_REAL_WEEKLY',
  'TARGET_JACKPOT_WEEKLY',
  'WEEKS_REMAINING',
  'netCentsForTier',
  'kilosForAmountCents',
  'shopCodeToKilos',
  'gross_cents',
  'count_tier',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_TOKEN',
  // El neto promedio esperado por aporte.
  '5.66',
  // Los precios formateados, por si alguno se escribe a mano en un componente.
  '$5',
  '$12',
  '$25',
  '$50',
  '5.00',
  '12.00',
  '25.00',
  '50.00',
]

/**
 * Los cuatro precios en centavos sueltos son números comunes y darían falsos
 * positivos, pero los cuatro juntos en un mismo archivo son la tabla de precios
 * y nada más.
 */
const PRICE_CENTS = ['500', '1200', '2500', '5000']

const files = []
;(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(js|mjs|css|html|json|map)$/.test(entry)) files.push(full)
  }
})(DIST)

const findings = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  for (const needle of FORBIDDEN) {
    if (source.includes(needle)) findings.push(`${relative('.', file)}: "${needle}"`)
  }
  const hits = PRICE_CENTS.filter((cents) => new RegExp(`(?<!\\d)${cents}(?!\\d)`).test(source))
  if (hits.length === PRICE_CENTS.length) {
    findings.push(`${relative('.', file)}: la tabla de precios entera (${hits.join(', ')})`)
  }
}

// Vite inlina cualquier env var con prefijo VITE_. Ninguna de esta capa lo lleva.
const leakedEnv = Object.keys(process.env).filter(
  (k) => k.startsWith('VITE_') && /PRICE|CENTS|PAYPAL|KOFI_|SECRET|TARGET|NET|GROSS|STATS/i.test(k),
)
for (const key of leakedEnv) findings.push(`env: ${key} lleva prefijo VITE_ y se inlina en el bundle`)

if (findings.length > 0) {
  console.error('\ncheck-leak: la capa de economía se filtró al cliente\n')
  for (const f of findings) console.error(`  ${f}`)
  console.error('\nMové eso a api/_lib/economy.ts. El build queda cancelado.\n')
  process.exit(1)
}

console.log(`check-leak: ok, ${files.length} archivos de dist/ limpios`)
