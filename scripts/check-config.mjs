#!/usr/bin/env node
/**
 * Avisa en el log del build qué falta configurar antes de que la página sirva
 * para cobrar. Por defecto no cancela el build: mientras se está mirando el
 * diseño conviene poder deployar igual.
 *
 * Con REQUIRE_KOFI_CONFIG=1 pasa a cancelar, para el día que salga a la calle.
 */
import { readFileSync } from 'node:fs'

/** Env vars que ya no hacen nada. Duplica DEPRECATED_ENV de economy.ts. */
const DEPRECATED_ENV = [
  'EXPECTED_NET_TICKET',
  'KOFI_USERNAME',
  'WEEKS_REMAINING',
  'SEED_KILOS',
  'OVERWEIGHT_SHIPPING_CENTS',
  'KOFI_ITEM_ONE',
  'KOFI_ITEM_THREE',
  'KOFI_ITEM_CARRY',
  'KOFI_ITEM_OVERWEIGHT',
]

/**
 * Una env var que existe pero está vacía es peor que una ausente: aparece
 * cargada en el panel y no lo está. Pasó con las credenciales de KV, y el
 * síntoma era el contador en null sin nada que lo explicara.
 */
const EMPTY_MATTERS = [
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STATS_SECRET',
  'KOFI_VERIFICATION_TOKEN',
  'SEED_GRAMS',
  'SEED_PEOPLE',
  'TARGET_PEOPLE',
  'DEPARTURE_DATE',
]

const source = readFileSync('src/config/kofi.ts', 'utf8')
const username = source.match(/export const KOFI_USERNAME = '([^']*)'/)?.[1] ?? ''

const warnings = []

if (!username) {
  warnings.push('KOFI_USERNAME vacío en src/config/kofi.ts: el botón no lleva a ningún lado')
}

// Sin este token el webhook rechaza todo y el contador no sube nunca.
if (!process.env.KOFI_VERIFICATION_TOKEN) {
  warnings.push(
    'KOFI_VERIFICATION_TOKEN sin cargar: la página anda y los pagos entran, pero el ' +
      'contador no se mueve solo. Se corrige después subiendo SEED_GRAMS y SEED_PEOPLE.',
  )
}

// La fecha del vuelo: si no parsea, la cuenta regresiva miente en silencio.
const departure = process.env.DEPARTURE_DATE?.trim()
if (departure && Number.isNaN(new Date(departure).getTime())) {
  warnings.push(`DEPARTURE_DATE no es una fecha válida: "${departure}". Se usa la de respaldo.`)
}

const empty = EMPTY_MATTERS.filter((k) => process.env[k] === '')
if (empty.length > 0) {
  warnings.push(
    `env vars cargadas con valor VACÍO: ${empty.join(', ')}. ` +
      'Existen en el panel pero no tienen contenido, así que la función no puede usarlas.',
  )
}

const stale = DEPRECATED_ENV.filter((k) => process.env[k] !== undefined && process.env[k] !== '')
if (stale.length > 0) {
  warnings.push(
    `env vars cargadas que ya no se usan y no hacen nada: ${stale.join(', ')}. ` +
      'Se pueden borrar de Vercel cuando pases; el deploy anda igual.',
  )
}

if (warnings.length === 0) {
  console.log(`check-config: ok, el botón apunta a ko-fi.com/${username} y el webhook está conectado`)
  process.exit(0)
}

const fatal = process.env.REQUIRE_KOFI_CONFIG === '1'
console[fatal ? 'error' : 'warn'](`\n${fatal ? 'check-config: falta configurar' : 'check-config: aviso'}\n`)
for (const w of warnings) console[fatal ? 'error' : 'warn'](`  ${w}`)
console[fatal ? 'error' : 'warn'](
  fatal ? '\nRevisá lo de arriba. El build queda cancelado.\n' : '\nLa página deploya igual.\n',
)
process.exit(fatal ? 1 : 0)
