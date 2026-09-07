/**
 * Todas las env vars del servidor, leídas con acceso ESTÁTICO.
 *
 * En el runtime edge de Vercel los accesos `process.env.NOMBRE` se resuelven en
 * el build; los accesos por índice, `process.env[variable]`, no son confiables.
 * Leerlas todas acá de una vez es la única forma de garantizar que una variable
 * cargada en el panel llegue de verdad a la función.
 *
 * Sin esto una comisión mal leída no rompe nada visible: simplemente cae al
 * default y el dashboard miente en silencio.
 */
const RAW = {
  KOFI_VERIFICATION_TOKEN: process.env.KOFI_VERIFICATION_TOKEN,
  STATS_SECRET: process.env.STATS_SECRET,

  SEED_GRAMS: process.env.SEED_GRAMS,
  SEED_PEOPLE: process.env.SEED_PEOPLE,
  TARGET_PEOPLE: process.env.TARGET_PEOPLE,
  DEPARTURE_DATE: process.env.DEPARTURE_DATE,

  KOFI_PCT: process.env.KOFI_PCT,
  PAYPAL_PCT: process.env.PAYPAL_PCT,
  PAYPAL_FIXED_CENTS: process.env.PAYPAL_FIXED_CENTS,
  TARGET_FLOOR_WEEKLY: process.env.TARGET_FLOOR_WEEKLY,
  TARGET_REAL_WEEKLY: process.env.TARGET_REAL_WEEKLY,
  TARGET_JACKPOT_WEEKLY: process.env.TARGET_JACKPOT_WEEKLY,
} as const

export type EnvName = keyof typeof RAW

export function envText(name: EnvName): string | undefined {
  const v = RAW[name]
  return v === undefined || v === '' ? undefined : v
}

export function envNumber(name: EnvName, fallback: number): number {
  const raw = envText(name)
  if (raw === undefined) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function envInt(name: EnvName, fallback: number): number {
  const raw = envText(name)
  if (raw === undefined) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}
