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

const warnings = []
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
console[fatal ? 'error' : 'warn'](
  fatal
    ? '\nCargá los códigos en src/config/tiers.ts. El build queda cancelado.\n'
    : '\nLa página deploya igual, con los botones apagados y "The shop is not open yet."\n',
)
process.exit(fatal ? 1 : 0)
