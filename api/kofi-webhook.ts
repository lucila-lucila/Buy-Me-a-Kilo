/**
 * Webhook de Ko-fi.
 *
 * Regla dura: acá adentro pasan nombres, mails y direcciones. No se guardan, no
 * se loguean, no se reenvían. Se destructuran los cinco campos que importan y
 * el resto del payload muere en esta función. NUNCA agregar un console.log del
 * objeto entero, ni siquiera para debuggear una vez.
 */
import { pipeline, cmd, RedisUnavailable } from './_lib/redis'
import { K } from './_lib/keys'
import { isoWeekKey } from './_lib/week'
import { shopCodeToKilos, kilosForAmountCents } from './_lib/economy'

export const config = { runtime: 'edge' }

const DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60

/** Comparación en tiempo constante, para no filtrar el token por timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

interface ShopItem {
  direct_link_code?: string
  quantity?: number
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  const expected = process.env.KOFI_VERIFICATION_TOKEN
  if (!expected) {
    console.error('kofi: KOFI_VERIFICATION_TOKEN no configurado')
    return new Response('not configured', { status: 500 })
  }

  // ---- solo estas seis variables sobreviven al parseo -----------------------
  let verification_token = ''
  let type = ''
  let amount = '0'
  let currency = 'USD'
  let kofi_transaction_id = ''
  let shop_items: ShopItem[] = []

  try {
    const raw = new URLSearchParams(await req.text()).get('data')
    if (!raw) return new Response('bad request', { status: 400 })
    const p = JSON.parse(raw) as Record<string, unknown>
    verification_token = String(p.verification_token ?? '')
    type = String(p.type ?? '')
    amount = String(p.amount ?? '0')
    currency = String(p.currency ?? 'USD').toUpperCase()
    kofi_transaction_id = String(p.kofi_transaction_id ?? '')
    shop_items = Array.isArray(p.shop_items) ? (p.shop_items as ShopItem[]) : []
    // from_name, email, message, url, shipping y todo lo demás quedan afuera a propósito.
  } catch {
    console.error('kofi: payload ilegible') // sin cuerpo: trae mails
    return new Response('bad request', { status: 400 })
  }

  if (!safeEqual(verification_token, expected)) {
    return new Response('unauthorized', { status: 401 })
  }
  if (!kofi_transaction_id) return new Response('bad request', { status: 400 })

  const week = isoWeekKey()
  const cents = Math.round(Number.parseFloat(amount) * 100)
  if (!Number.isFinite(cents) || cents < 0) {
    console.error('kofi: monto ilegible', kofi_transaction_id)
    return new Response('bad request', { status: 400 })
  }

  let claimedDedupe = false
  try {
    // Dedupe de reintentos. Es un ID de transacción, no un dato personal, y se
    // borra solo a los 7 días.
    const claimed = await cmd('SET', K.dedupe(kofi_transaction_id), '1', 'NX', 'EX', DEDUPE_TTL_SECONDS)
    if (claimed === null) return new Response('duplicate', { status: 200 })
    claimedDedupe = true

    // Moneda distinta de USD: no inventamos tipo de cambio, así que no suma
    // kilos. Se cuenta aparte para que salte en el dashboard, porque si aparece
    // seguido es que hay algo mal configurado en Ko-fi.
    if (currency !== 'USD') {
      await cmd('INCR', K.grossOther)
      return new Response('ok', { status: 200 })
    }

    // Shop Order: los kilos salen del código del item, no del monto. Un
    // descuento o un cambio de precio no puede desalinear el contador.
    // Donation suelta: escalera por monto, redondeo hacia abajo.
    const writes: (string | number)[][] = []
    let kilos = 0

    if (type === 'Shop Order' && shop_items.length > 0) {
      const codes = shopCodeToKilos()
      for (const item of shop_items) {
        const code = String(item.direct_link_code ?? '').toLowerCase()
        const perItem = codes.get(code)
        if (perItem === undefined) continue
        const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)) || 1)
        kilos += perItem * qty
        writes.push(['INCRBY', K.tierTotal(perItem), qty])
        writes.push(['INCRBY', K.tierWeek(perItem, week), qty])
      }
      if (kilos === 0) {
        // Item desconocido (código nuevo sin cargar todavía). Cae al respaldo
        // por monto para no perder los kilos de alguien que ya pagó.
        kilos = kilosForAmountCents(cents)
        console.error('kofi: shop item sin mapear, uso monto', kofi_transaction_id)
        if (kilos > 0) {
          writes.push(['INCR', K.tierTotal(kilos)], ['INCR', K.tierWeek(kilos, week)])
        }
      }
    } else {
      kilos = kilosForAmountCents(cents)
      if (kilos > 0) writes.push(['INCR', K.tierTotal(kilos)], ['INCR', K.tierWeek(kilos, week)])
    }

    if (kilos > 0) {
      writes.push(['INCRBY', K.totalKilos, kilos], ['INCRBY', K.weekKilos(week), kilos])
    }
    writes.push(
      ['INCRBY', K.grossTotal, cents],
      ['INCRBY', K.grossWeek(week), cents],
      ['INCR', K.contribTotal],
      ['INCR', K.contribWeek(week)],
    )

    await pipeline(writes)
    return new Response('ok', { status: 200 })
  } catch (err) {
    const code = err instanceof RedisUnavailable ? 'kv' : 'unknown'
    console.error('kofi: fallo al escribir', code, kofi_transaction_id)
    // Soltamos la marca de dedupe: si no, el reintento de Ko-fi se descarta
    // como duplicado y esos kilos se pierden para siempre.
    if (claimedDedupe) await cmd('DEL', K.dedupe(kofi_transaction_id)).catch(() => {})
    // 500 para que Ko-fi reintente: el dedupe hace que el reintento sea seguro.
    return new Response('retry', { status: 500 })
  }
}
