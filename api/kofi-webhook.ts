/**
 * Webhook de Ko-fi.
 *
 * Regla dura: acá adentro pasan nombres, mails y direcciones. No se guardan, no
 * se loguean, no se reenvían. Se destructuran los cinco campos que importan y
 * el resto del payload muere en esta función. NUNCA agregar un console.log del
 * objeto entero, ni siquiera para debuggear una vez.
 */
import { pipeline, cmd, RedisUnavailable, describeKvEnv } from './_lib/redis.js'
import { K } from './_lib/keys.js'
import { isoWeekKey } from './_lib/week.js'
import { gramsForDollars } from '../src/config/suitcase.js'
import { envText } from './_lib/env.js'

export const config = { runtime: 'edge' }

const DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60

/**
 * El id que Ko-fi manda en su webhook de prueba. Es un valor fijo y documentado.
 *
 * Con la prueba se recorre todo el circuito —parsear, validar el token,
 * confirmar que KV responde— pero no se toca el contador: si contara, verificar
 * la conexión ensuciaría el número con gramos que no corresponden a nadie, y el
 * contador tiene que ser real.
 */
const KOFI_TEST_TRANSACTION_ID = '00000000-1111-2222-3333-444444444444'

/** Comparación en tiempo constante, para no filtrar el token por timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  const expected = envText('KOFI_VERIFICATION_TOKEN')
  if (!expected) {
    console.error('kofi: KOFI_VERIFICATION_TOKEN no configurado')
    return new Response('not configured', { status: 500 })
  }

  // ---- solo estas cinco variables sobreviven al parseo ----------------------
  let verification_token = ''
  let type = ''
  let amount = '0'
  let currency = 'USD'
  let kofi_transaction_id = ''

  try {
    const raw = new URLSearchParams(await req.text()).get('data')
    if (!raw) return new Response('bad request', { status: 400 })
    const p = JSON.parse(raw) as Record<string, unknown>
    verification_token = String(p.verification_token ?? '')
    type = String(p.type ?? '')
    amount = String(p.amount ?? '0')
    currency = String(p.currency ?? 'USD').toUpperCase()
    kofi_transaction_id = String(p.kofi_transaction_id ?? '')
    // from_name, email, message, url y shipping quedan afuera a propósito. No se
    // manda nada por correo, así que la dirección no hace falta ni para eso.
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
    if (kofi_transaction_id === KOFI_TEST_TRANSACTION_ID) {
      // Se toca KV a propósito, para confirmar que la conexión está viva, pero
      // sobre una clave descartable y no sobre el contador.
      await cmd('SET', 'kofi_test_ping', String(Date.now()), 'EX', 3600)
      console.log('kofi: webhook de prueba ok, no se contó nada')
      return new Response('test ok', { status: 200 })
    }

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

    // Monto libre: la conversión es proporcional y no hay escalones. Un aporte
    // no llena un kilo, aporta una fracción, y entre muchos llenan uno.
    const grams = gramsForDollars(cents / 100)

    const writes: (string | number)[][] = [
      ['INCRBY', K.grossTotal, cents],
      ['INCRBY', K.grossWeek(week), cents],
      ['INCR', K.contribTotal],
      ['INCR', K.contribWeek(week)],
    ]
    if (grams > 0) {
      writes.push(['INCRBY', K.totalGrams, grams], ['INCRBY', K.weekGrams(week), grams])
    }

    await pipeline(writes)
    // Una línea en el caso exitoso: sin esto un webhook que anda bien no deja
    // rastro y no hay nada que mirar en los logs. Sin datos personales.
    console.log('kofi: ok', type || 'sin tipo', grams, 'g', kofi_transaction_id)
    return new Response('ok', { status: 200 })
  } catch (err) {
    const code = err instanceof RedisUnavailable ? 'kv' : 'unknown'
    console.error('kofi: fallo al escribir', code, kofi_transaction_id)
    if (code === 'kv') console.error('kofi: estado de kv', JSON.stringify(describeKvEnv()))
    // Soltamos la marca de dedupe: si no, el reintento de Ko-fi se descarta
    // como duplicado y esos kilos se pierden para siempre.
    if (claimedDedupe) await cmd('DEL', K.dedupe(kofi_transaction_id)).catch(() => {})
    // 500 para que Ko-fi reintente: el dedupe hace que el reintento sea seguro.
    return new Response('retry', { status: 500 })
  }
}
