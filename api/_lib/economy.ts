/**
 * CAPA DE ECONOMÍA — SOLO SERVIDOR.
 *
 * Nada de este archivo puede terminar en el bundle del cliente. Ninguna de sus
 * env vars lleva prefijo VITE_, y scripts/check-leak.mjs falla el build si
 * cualquiera de estos montos aparece en dist/.
 *
 * El único import hacia src/ es la lista de tiers, que a propósito no tiene
 * precios: son los direct_link_code de Ko-fi, que son públicos porque viven en
 * la URL del checkout. Se importa en vez de duplicarse para que no puedan
 * quedar desincronizados, que sería un bug de plata silencioso.
 */
import { TIERS, type TierId } from '../../src/config/tiers'

const env = (k: string, fallback: number): number => {
  const raw = process.env[k]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Precio real de cada tier, en centavos. Nunca sale de este archivo. */
export const TIER_PRICE_CENTS: Record<TierId, number> = {
  one: 500,
  three: 1200,
  carry: 2500,
  overweight: 5000,
}

/** Escalera monto -> kilos. Solo respaldo para donations sueltas. */
export const AMOUNT_LADDER: { cents: number; kilos: number }[] = [
  { cents: 5000, kilos: 12 },
  { cents: 2500, kilos: 6 },
  { cents: 1200, kilos: 3 },
  { cents: 500, kilos: 1 },
]

export const KILOS_BY_TIER: Record<TierId, number> = Object.fromEntries(
  TIERS.map((t) => [t.id, t.kilos]),
) as Record<TierId, number>

/**
 * direct_link_code -> kilos, para los Shop Order. El código del item no falla
 * nunca: sobrevive descuentos y cambios de precio, que sí romperían el mapeo
 * por monto. Cada tier acepta un override por env (KOFI_ITEM_ONE, etc.) para
 * poder corregir un código en producción sin redeploy.
 */
export function shopCodeToKilos(): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of TIERS) {
    const override = process.env[`KOFI_ITEM_${t.id.toUpperCase()}`]
    const code = (override && override.trim()) || t.kofiItemCode
    if (code && !code.startsWith('PLACEHOLDER')) map.set(code.toLowerCase(), t.kilos)
  }
  return map
}

/** Redondeo hacia abajo: $7 suma 1 kilo, no 1,4. Menos de $5 suma cero. */
export function kilosForAmountCents(cents: number): number {
  for (const step of AMOUNT_LADDER) if (cents >= step.cents) return step.kilos
  return 0
}

// ---------------------------------------------------------------- comisiones

export const KOFI_PCT = env('KOFI_PCT', 0.05)
export const PAYPAL_PCT = env('PAYPAL_PCT', 0.029)
export const PAYPAL_FIXED_CENTS = env('PAYPAL_FIXED_CENTS', 49)
/** Envío del sticker físico del tier de 50, ya descontado en su tabla de neto. */
export const OVERWEIGHT_SHIPPING_CENTS = env('OVERWEIGHT_SHIPPING_CENTS', 1050)

/** Neto de una transacción de `gross` centavos, después de Ko-fi y PayPal. */
export function netCents(gross: number, opts: { shippingCents?: number } = {}): number {
  const fees = gross * KOFI_PCT + gross * PAYPAL_PCT + PAYPAL_FIXED_CENTS
  return Math.max(0, Math.round(gross - fees - (opts.shippingCents ?? 0)))
}

export function netCentsForTier(id: TierId): number {
  return netCents(TIER_PRICE_CENTS[id], {
    shippingCents: id === 'overweight' ? OVERWEIGHT_SHIPPING_CENTS : 0,
  })
}

// -------------------------------------------------------- escenarios internos

/** Mezcla esperada con tráfico frío: 85 / 10 / 4 / 1. */
export const EXPECTED_MIX: Record<TierId, number> = {
  one: 0.85,
  three: 0.1,
  carry: 0.04,
  overweight: 0.01,
}

/** Neto promedio por aporte con esa mezcla, en centavos. */
export const EXPECTED_NET_TICKET_CENTS = Math.round(env('EXPECTED_NET_TICKET', 5.66) * 100)

/** Aportes por semana. No son metas de plata: son pisos para saber dónde cayó la semana. */
export const TARGETS = {
  floor: env('TARGET_FLOOR_WEEKLY', 60),
  real: env('TARGET_REAL_WEEKLY', 200),
  jackpot: env('TARGET_JACKPOT_WEEKLY', 1500),
}

export const WEEKS_REMAINING = env('WEEKS_REMAINING', 12)
