/**
 * El estado del viaje: valija en curso, personas y cuenta regresiva.
 *
 * Todo derivado de dos enteros de KV más el arrastre. Nada de esto se guarda por
 * separado, así que no se puede desincronizar.
 */
import { SUITCASE_CAPACITY_KG } from '../../src/config/suitcase.js'
import { envInt, envText } from './env.js'

/**
 * Arrastre inicial: 289 aportes reales que llegaron por redes antes de que esta
 * página existiera, contados como un kilo por persona, que es la lectura más
 * conservadora.
 *
 * Se suma al leer y no se escribe en KV: así el contador del webhook sigue
 * siendo solo lo que pasó por acá, y corregir el arrastre no toca la base.
 *
 * El default NO es cero a propósito. Si estas variables se borran o quedan
 * vacías, con cero el número de valija retrocedería de #13 a #1, y la regla dura
 * es que nunca retrocede. Con el valor real como default, borrarlas no cambia
 * nada. Los valores viven además en las env vars para poder corregirlos sin
 * tocar código.
 */
export const SEED_KILOS = envInt('SEED_KILOS', 289)
export const SEED_PEOPLE = envInt('SEED_PEOPLE', 289)

/** Medianoche de Buenos Aires, cinco semanas desde el 6 de septiembre de 2026. */
const DEPARTURE_FALLBACK = '2026-10-11T00:00:00-03:00'

export function departureDate(): Date {
  const raw = envText('DEPARTURE_DATE')?.trim()
  const d = new Date(raw && raw !== '' ? raw : DEPARTURE_FALLBACK)
  return Number.isNaN(d.getTime()) ? new Date(DEPARTURE_FALLBACK) : d
}

export interface JourneyState {
  totalKilos: number
  totalPeople: number
  suitcaseNumber: number
  kilosInCurrent: number
  suitcaseCapacity: number
  weekKilos: number
  weekPeople: number
  daysRemaining: number
  departed: boolean
}

/**
 * `kilosInCurrent` en 0 con total distinto de 0 es una valija recién estrenada,
 * no la anterior llena: el módulo lo resuelve solo.
 */
export function journeyState(raw: {
  kilos: number
  people: number
  weekKilos: number
  weekPeople: number
  now?: Date
}): JourneyState {
  const totalKilos = SEED_KILOS + raw.kilos
  const totalPeople = SEED_PEOPLE + raw.people
  const now = raw.now ?? new Date()
  const msLeft = departureDate().getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(msLeft / 86_400_000))

  return {
    totalKilos,
    totalPeople,
    suitcaseNumber: Math.floor(totalKilos / SUITCASE_CAPACITY_KG) + 1,
    kilosInCurrent: totalKilos % SUITCASE_CAPACITY_KG,
    suitcaseCapacity: SUITCASE_CAPACITY_KG,
    weekKilos: raw.weekKilos,
    weekPeople: raw.weekPeople,
    daysRemaining,
    departed: daysRemaining <= 0,
  }
}

/** Semanas que faltan, para la proyección del dashboard. Reemplaza a WEEKS_REMAINING. */
export const weeksRemaining = (days: number): number => Math.max(0, Math.ceil(days / 7))
