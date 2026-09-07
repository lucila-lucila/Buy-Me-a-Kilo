/**
 * El estado del viaje: cuánto pesa la valija y cuántos días faltan.
 *
 * Todo sale de un único número, los gramos totales. El nivel del relleno, la
 * barra, los kilos y el porcentaje leen la misma fuente: si alguna vez el nivel
 * dibujado y el porcentaje no coinciden, es un bug.
 *
 *   personas que aportaron
 *     -> gramos que suman sus aportes
 *       -> gramos totales (+ SEED_GRAMS)
 *         -> percentFull = gramos / 23000
 *           -> altura del relleno, barra, kilos y porcentaje en pantalla
 */
import { SUITCASE_CAPACITY_G } from '../../src/config/suitcase.js'
import { envInt, envText } from './env.js'

/**
 * Arrastre inicial: 289 aportes reales que llegaron por redes antes de que esta
 * página existiera. 1.309 g es la conversión de lo que aportaron. La valija arranca al 5,7%, y está bien que se vea poco llena: hay
 * cinco semanas por delante y una barra casi llena no tiene nada que contar.
 *
 * Se suma al leer y no se escribe en KV, así el contador del webhook sigue
 * siendo solo lo que pasó por acá. El default NO es cero: si las variables se
 * borraran, con cero el número público bajaría, y la regla es que nunca baja.
 */
export const SEED_GRAMS = envInt('SEED_GRAMS', 1309)
export const SEED_PEOPLE = envInt('SEED_PEOPLE', 289)

/** Meta interna. Nunca se muestra en la página. */
export const TARGET_PEOPLE = envInt('TARGET_PEOPLE', 5200)

/**
 * Medianoche de Buenos Aires del 22 de octubre de 2026. Es solo el respaldo:
 * el valor real vive en DEPARTURE_DATE, cargado en los tres entornos de Vercel.
 * Si algún día la fecha se mueve, se mueve ahí y no hace falta un deploy.
 */
const DEPARTURE_FALLBACK = '2026-10-22T00:00:00-03:00'

export function departureDate(): Date {
  const raw = envText('DEPARTURE_DATE')?.trim()
  const d = new Date(raw && raw !== '' ? raw : DEPARTURE_FALLBACK)
  return Number.isNaN(d.getTime()) ? new Date(DEPARTURE_FALLBACK) : d
}

export interface JourneyState {
  gramsTotal: number
  kilosTotal: number
  capacityKilos: number
  peopleTotal: number
  percentFull: number
  /** Días enteros hacia arriba. Lo usa la prosa y la proyección del dashboard. */
  daysRemaining: number
  /**
   * Los milisegundos exactos que faltan. Es de acá que salen los días, las horas
   * y los minutos de la página: un solo número, como los gramos. El cliente lo
   * descuenta contra su propio reloj corregido por la edad de la respuesta, así
   * que un visitante con la hora mal igual ve la cuenta bien.
   */
  msRemaining: number
  /** La fecha en sí, para poder verificar de un vistazo qué fecha llegó. */
  departureIso: string
  departed: boolean
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function journeyState(raw: {
  grams: number
  people: number
  now?: Date
}): JourneyState {
  const gramsTotal = SEED_GRAMS + raw.grams
  const now = raw.now ?? new Date()
  const departure = departureDate()
  const msRemaining = Math.max(0, departure.getTime() - now.getTime())
  const daysRemaining = Math.ceil(msRemaining / 86_400_000)

  return {
    gramsTotal,
    kilosTotal: round1(gramsTotal / 1000),
    capacityKilos: SUITCASE_CAPACITY_G / 1000,
    peopleTotal: SEED_PEOPLE + raw.people,
    percentFull: round1((gramsTotal / SUITCASE_CAPACITY_G) * 100),
    daysRemaining,
    msRemaining,
    departureIso: departure.toISOString(),
    departed: msRemaining <= 0,
  }
}

/** Semanas que faltan, para la proyección del dashboard. */
export const weeksRemaining = (days: number): number => Math.max(0, Math.ceil(days / 7))
