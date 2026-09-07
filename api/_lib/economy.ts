/**
 * CAPA DE ECONOMÍA — SOLO SERVIDOR.
 *
 * Los precios ahora se muestran en la página, así que la regla de esconderlos se
 * eliminó. Lo que sigue sin poder llegar al bundle del cliente son las
 * comisiones, los pisos semanales y TARGET_PEOPLE: ninguna de estas env vars
 * lleva prefijo VITE_, y scripts/check-leak.mjs falla el build si aparecen.
 *
 * Ya no hay tiers: el aporte es de monto libre. Con eso se fueron la tabla de
 * precios, la escalera por monto, el mapeo por direct_link_code y la mezcla
 * esperada. Esa mezcla nunca fue un dato medido sino una estimación, y comparar
 * la realidad contra una suposición no informaba nada. El ticket promedio real,
 * mirado semana a semana, es la única pregunta que tiene sentido con montos
 * libres, y ese sale de los datos.
 */
import { envNumber as env } from './env.js'

// ---------------------------------------------------------------- comisiones

export const KOFI_PCT = env('KOFI_PCT', 0.05)
export const PAYPAL_PCT = env('PAYPAL_PCT', 0.029)
export const PAYPAL_FIXED_CENTS = env('PAYPAL_FIXED_CENTS', 49)

/**
 * Neto de una transacción de `gross` centavos, después de Ko-fi y PayPal.
 * Ya no hay envío físico que descontar: no se manda nada por correo.
 */
export function netCents(gross: number): number {
  const fees = gross * KOFI_PCT + gross * PAYPAL_PCT + PAYPAL_FIXED_CENTS
  return Math.max(0, Math.round(gross - fees))
}

// -------------------------------------------------------- escenarios internos

/** Env vars que quedaron sin uso. El build las señala si siguen cargadas. */
export const DEPRECATED_ENV = [
  'EXPECTED_NET_TICKET',
  'KOFI_USERNAME',
  'WEEKS_REMAINING',
  'SEED_KILOS',
  // Se fueron con los tiers.
  'OVERWEIGHT_SHIPPING_CENTS',
  'KOFI_ITEM_ONE',
  'KOFI_ITEM_THREE',
  'KOFI_ITEM_CARRY',
  'KOFI_ITEM_OVERWEIGHT',
]

/** Aportes por semana. No son metas de plata: son pisos para saber dónde cayó la semana. */
export const TARGETS = {
  floor: env('TARGET_FLOOR_WEEKLY', 60),
  real: env('TARGET_REAL_WEEKLY', 200),
  jackpot: env('TARGET_JACKPOT_WEEKLY', 1500),
}
