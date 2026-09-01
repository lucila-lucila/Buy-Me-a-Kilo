/**
 * La colección vive solo en el localStorage de cada persona. Sin cuentas, sin
 * login, sin base de datos de usuarios. Si borra el navegador, se le borra la
 * colección, y eso está bien.
 */
const KEY = 'bmak.collection.v1'

export type Collection = Record<string, number>

export function readCollection(): Collection {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Collection = {}
    for (const [id, n] of Object.entries(parsed as Record<string, unknown>)) {
      const count = Math.floor(Number(n))
      if (Number.isFinite(count) && count > 0) out[id] = count
    }
    return out
  } catch {
    // Modo privado, storage lleno o JSON roto: se sigue como si estuviera vacía.
    return {}
  }
}

/** Suma uno y devuelve si ya lo tenía. */
export function addToCollection(id: string): { duplicate: boolean; total: number } {
  const current = readCollection()
  const had = (current[id] ?? 0) > 0
  const next: Collection = { ...current, [id]: (current[id] ?? 0) + 1 }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* si no se puede guardar, la revelación igual pasa */
  }
  return { duplicate: had, total: Object.keys(next).length }
}

export const distinctCount = (c: Collection) => Object.keys(c).length
