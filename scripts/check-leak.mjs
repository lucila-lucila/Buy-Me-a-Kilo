#!/usr/bin/env node
/**
 * Verifica que nada de la capa de economía haya terminado en dist/.
 *
 * Los montos dejaron de estar en la lista: los precios ahora se muestran en la
 * página, así que encontrar uno no es una fuga. Lo que sigue sin poder llegar al
 * cliente son las comisiones, los pisos semanales, TARGET_PEOPLE y los tokens.
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
  'PAYPAL_FIXED_CENTS',
  'PAYPAL_PCT',
  'KOFI_PCT',
  'KOFI_VERIFICATION_TOKEN',
  'STATS_SECRET',
  'TARGET_FLOOR_WEEKLY',
  'TARGET_REAL_WEEKLY',
  'TARGET_JACKPOT_WEEKLY',
  'WEEKS_REMAINING',
  // La meta interna de personas: se decide en el dashboard, no en la página.
  'TARGET_PEOPLE',
  'gross_cents',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_TOKEN',
]

/** Las env vars que solo pueden existir del lado del servidor. Ver .env.example. */
const ECONOMY_ENV = [
  'KOFI_VERIFICATION_TOKEN',
  'KOFI_PCT',
  'TARGET_PEOPLE',
  'PAYPAL_PCT',
  'PAYPAL_FIXED_CENTS',
  'TARGET_FLOOR_WEEKLY',
  'TARGET_REAL_WEEKLY',
  'TARGET_JACKPOT_WEEKLY',
  'WEEKS_REMAINING',
  'STATS_SECRET',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

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
}

// Vite inlina cualquier env var con prefijo VITE_. Ninguna de esta capa lo lleva.
//
// Vercel inyecta sus variables de sistema con el prefijo del framework, así que
// en un proyecto Vite aparecen como VITE_VERCEL_*. Son públicas por diseño y no
// tienen nada nuestro adentro: van excluidas o el build se cae solo.
const isVercelSystemVar = (key) => key.startsWith('VITE_VERCEL_')

// Chequeo exacto: ninguna de nuestras variables de servidor con prefijo VITE_.
for (const name of ECONOMY_ENV) {
  if (process.env[`VITE_${name}`] !== undefined) {
    findings.push(`env: VITE_${name} se inlina en el bundle. Sacale el prefijo VITE_.`)
  }
}

// Red de seguridad por si mañana aparece una variable que no está en la lista.
// El patrón es angosto a propósito: acá un falso positivo cancela un deploy.
for (const key of Object.keys(process.env)) {
  if (!key.startsWith('VITE_') || isVercelSystemVar(key)) continue
  if (!/PAYPAL|KOFI|_CENTS|_SECRET|GROSS|TARGET_(FLOOR|REAL|JACKPOT)|NET_TICKET/i.test(key)) continue
  if (findings.some((f) => f.includes(key))) continue
  findings.push(`env: ${key} lleva prefijo VITE_ y parece de la capa de economía`)
}

if (findings.length > 0) {
  console.error('\ncheck-leak: la capa de economía se filtró al cliente\n')
  for (const f of findings) console.error(`  ${f}`)
  console.error('\nMové eso a api/_lib/economy.ts. El build queda cancelado.\n')
  process.exit(1)
}

console.log(`check-leak: ok, ${files.length} archivos de dist/ limpios`)
