/**
 * Pide el número de serie del sticker que acaba de salir.
 *
 * El servidor no guarda nada sobre quién lo pidió: es un contador que sube. Si
 * falla, devuelve null y la tarjeta sale sin la línea, nunca con un número
 * inventado.
 */
const STORE = 'bmak.serials.v1'

export async function claimSerial(stickerId: string): Promise<number | null> {
  try {
    const res = await fetch('/api/serial', { method: 'POST' })
    if (!res.ok) return null
    const { serial } = (await res.json()) as { serial: number | null }
    if (typeof serial !== 'number') return null
    remember(stickerId, serial)
    return serial
  } catch {
    return null
  }
}

/** Se guardan en el navegador de cada persona, como la colección. */
function remember(stickerId: string, serial: number): void {
  try {
    const raw = localStorage.getItem(STORE)
    const list: { id: string; serial: number }[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return
    list.push({ id: stickerId, serial })
    localStorage.setItem(STORE, JSON.stringify(list.slice(-100)))
  } catch {
    /* modo privado o storage lleno: el número igual se muestra */
  }
}

export const formatSerial = (serial: number): string => `no. ${String(serial).padStart(4, '0')}`
