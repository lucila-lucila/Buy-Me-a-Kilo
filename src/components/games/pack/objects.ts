import { STICKERS, webpSrc } from '../../../config/stickers'
import { readCollection } from '../../../lib/collection'

/**
 * Los objetos que caen: los mismos bichos del mundo de los stickers.
 *
 * Tres tamaños, y el peso sube con el tamaño. Ahí está la decisión del juego:
 * los chicos entran fácil pero casi no pesan, los grandes pesan pero
 * desestabilizan la pila.
 *
 * Quien ya tiene stickers juega con los suyos, a color. Quien no tiene, juega
 * con siluetas genéricas. Se lee del mismo localStorage de siempre: sin
 * cuentas, sin verificar nada y sin servidor. No es una recompensa prometida
 * —nadie dijo que esto existía—, es algo que aparece si ya lo tenías.
 */
export interface Piece {
  sprite: string
  /** Radio en fracción del ancho de la caja, para que escale con la pantalla. */
  size: number
  grams: number
  /** Si es uno de los suyos va a color; si no, en silueta. */
  own: boolean
}

const TAMAÑOS = [
  { size: 0.085, grams: 12 },
  { size: 0.115, grams: 28 },
  { size: 0.15, grams: 55 },
] as const

/**
 * La bolsa de la que sale cada objeto. Los propios primero y repetidos, para
 * que se noten; después los genéricos para completar variedad.
 */
export function buildBag(): Piece[] {
  const own = Object.keys(readCollection()).filter((id) => STICKERS.some((s) => s.id === id))
  const genericos = STICKERS.map((s) => s.id).filter((id) => !own.includes(id))

  const bolsa: Piece[] = []
  for (const [i, id] of own.entries()) {
    for (const t of TAMAÑOS) bolsa.push({ sprite: webpSrc(id), ...t, own: true })
    // Un poco más de los propios que de los otros, sin llegar a que sean todos.
    if (i < 3) bolsa.push({ sprite: webpSrc(id), ...TAMAÑOS[1], own: true })
  }
  for (const id of genericos) {
    for (const t of TAMAÑOS) bolsa.push({ sprite: webpSrc(id), ...t, own: false })
  }
  return bolsa
}

/** Uno al azar. Sin rachas ni pity: es un juego, no un casino. */
export const pick = (bag: Piece[]): Piece => bag[Math.floor(Math.random() * bag.length)]
