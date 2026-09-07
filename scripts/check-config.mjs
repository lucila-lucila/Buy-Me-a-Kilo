#!/usr/bin/env node
/**
 * Avisa en el log del build qué falta configurar antes de que la página sirva
 * para cobrar. Por defecto no cancela el build: mientras se está mirando el
 * diseño conviene poder deployar con los botones apagados.
 *
 * Cuando salga a la calle, poné REQUIRE_KOFI_CONFIG=1 en Vercel y a partir de
 * ahí un deploy sin los códigos de Ko-fi cargados falla en vez de publicar
 * cuatro botones que no llevan a ningún lado.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync('src/config/tiers.ts', 'utf8')

const placeholders = [...source.matchAll(/kofiItemCode:\s*'(PLACEHOLDER_[A-Z]+)'/g)].map((m) => m[1])
const username = source.match(/export const KOFI_USERNAME = '([^']*)'/)?.[1] ?? ''

/** Env vars que ya no hace nada tener cargadas. Ver DEPRECATED_ENV en economy.ts. */
const DEPRECATED_ENV = ['EXPECTED_NET_TICKET', 'KOFI_USERNAME']

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
  'SEED_KILOS',
  'SEED_PEOPLE',
  'DEPARTURE_DATE',
]

const warnings = []

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
if (placeholders.length > 0) {
  warnings.push(
    `${placeholders.length} de 4 tiers sin direct_link_code de Ko-fi: ${placeholders.join(', ')}`,
  )
}
if (!username) {
  warnings.push('KOFI_USERNAME vacío: los tiers sin código quedan sin link, apagados en la página')
}

if (warnings.length === 0) {
  console.log('check-config: ok, los cuatro tiers apuntan a un item de Ko-fi')
  process.exit(0)
}

const fatal = process.env.REQUIRE_KOFI_CONFIG === '1'
const label = fatal ? 'check-config: falta configurar Ko-fi' : 'check-config: aviso'
console[fatal ? 'error' : 'warn'](`\n${label}\n`)
for (const w of warnings) console[fatal ? 'error' : 'warn'](`  ${w}`)
const degraded = username
  ? `Los tiers sin código llevan al perfil (ko-fi.com/${username}) en vez de a su item.`
  : 'Los tiers sin código quedan apagados, con "The shop is not open yet." bajo la escalera.'

console[fatal ? 'error' : 'warn'](
  fatal
    ? '\nCargá los códigos en src/config/tiers.ts. El build queda cancelado.\n'
    : `\nLa página deploya igual. ${degraded}\n`,
)
process.exit(fatal ? 1 : 0)
