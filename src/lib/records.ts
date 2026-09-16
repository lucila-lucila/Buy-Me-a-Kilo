/**
 * El récord personal de cada juego. Vive en localStorage, como los stickers.
 *
 * Sin cuentas, sin servidor y sin tabla de posiciones: el único número contra el
 * que se juega es el propio. Si borra el navegador, se le borra el récord, y
 * eso está bien.
 */
const KEY = 'bmak.records.v1'

type Records = Record<string, number>

function read(): Records {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Records = {}
    for (const [id, n] of Object.entries(parsed as Record<string, unknown>)) {
      const v = Math.floor(Number(n))
      if (Number.isFinite(v) && v > 0) out[id] = v
    }
    return out
  } catch {
    // Modo privado, storage lleno o JSON roto: se juega sin récord.
    return {}
  }
}

export const bestOf = (game: string): number => read()[game] ?? 0

/** Guarda si mejoró y devuelve el récord que queda. */
export function remember(game: string, score: number): number {
  const best = bestOf(game)
  if (score <= best) return best
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [game]: score }))
  } catch {
    /* si no se puede guardar, la partida igual valió */
  }
  return score
}
