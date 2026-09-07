/**
 * Dashboard privado. GET /api/stats?key=<STATS_SECRET>
 *
 * Sin key válida devuelve 404 con el mismo cuerpo que un 404 real: no tiene que
 * notarse que el endpoint existe. Nada de lo que sale de acá se muestra nunca en
 * la página pública.
 *
 * Ya no hay sección de mezcla ni de desviación. Esa mezcla nunca fue un dato
 * medido sino una estimación, y con montos libres no hay escalera que comparar:
 * el ticket promedio real, semana a semana, es la única pregunta que informa.
 */
import { pipeline, toInt, describeKvEnv } from './_lib/redis.js'
import { K } from './_lib/keys.js'
import { isoWeekKey, previousWeekKeys } from './_lib/week.js'
import {
  journeyState,
  weeksRemaining,
  SEED_GRAMS,
  SEED_PEOPLE,
  TARGET_PEOPLE,
  departureDate,
} from './_lib/journey.js'
import { envText } from './_lib/env.js'
import { KOFI_PCT, PAYPAL_PCT, PAYPAL_FIXED_CENTS, TARGETS } from './_lib/economy.js'

export const config = { runtime: 'edge' }

const NOT_FOUND = new Response('The page could not be found.', {
  status: 404,
  headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
})

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const usd = (cents: number) => Math.round(cents) / 100

/**
 * Neto sobre un agregado. El porcentual escala con el bruto; la comisión fija de
 * PayPal es por transacción, así que necesita la cantidad de aportes.
 */
function netOf(grossCents: number, contribs: number): number {
  const variable = grossCents * (KOFI_PCT + PAYPAL_PCT)
  const fixed = PAYPAL_FIXED_CENTS * contribs
  return Math.max(0, Math.round(grossCents - variable - fixed))
}

export default async function handler(req: Request): Promise<Response> {
  const secret = envText('STATS_SECRET')
  const key = new URL(req.url).searchParams.get('key') ?? ''
  if (!secret) {
    // Para afuera es un 404 igual al de una clave equivocada. En los logs, que
    // son privados, queda claro que la diferencia es que la env var no llegó.
    console.error('stats: STATS_SECRET no configurado en este entorno')
    return NOT_FOUND
  }
  if (!safeEqual(key, secret)) return NOT_FOUND

  const week = isoWeekKey()
  const prev = previousWeekKeys(3)

  const reads: (string | number)[][] = [
    ['GET', K.totalGrams],
    ['GET', K.weekGrams(week)],
    ['GET', K.grossTotal],
    ['GET', K.grossWeek(week)],
    ['GET', K.contribTotal],
    ['GET', K.contribWeek(week)],
    ['GET', K.grossOther],
    ['GET', K.shareGenerated],
    ['GET', K.stickerSerial],
  ]
  for (const w of prev) reads.push(['GET', K.grossWeek(w)], ['GET', K.contribWeek(w)], ['GET', K.weekGrams(w)])

  let raw: unknown[]
  try {
    raw = await pipeline(reads)
  } catch (err) {
    // Diagnóstico: qué variables de KV ve la función. Solo nombres, nunca
    // valores. Es lo único que hace falta para saber por qué el contador da null.
    return Response.json(
      {
        error: 'kv unavailable',
        reason: err instanceof Error ? err.message : 'unknown',
        kvEnv: describeKvEnv(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let i = 0
  const totalGrams = toInt(raw[i++])
  const weekGrams = toInt(raw[i++])
  const grossTotal = toInt(raw[i++])
  const grossWeek = toInt(raw[i++])
  const contribTotal = toInt(raw[i++])
  const contribWeek = toInt(raw[i++])
  const otherCurrency = toInt(raw[i++])
  const shareGenerated = toInt(raw[i++])
  const stickersHandedOut = toInt(raw[i++])

  const history = prev.map((w) => ({
    week: w,
    grossCents: toInt(raw[i++]),
    contribs: toInt(raw[i++]),
    grams: toInt(raw[i++]),
  }))

  const netTotal = netOf(grossTotal, contribTotal)
  const netWeek = netOf(grossWeek, contribWeek)

  // Proyección al ritmo de las últimas 3 semanas cerradas.
  const closed = history.filter((h) => h.contribs > 0)
  const avgWeeklyNet =
    closed.length > 0 ? closed.reduce((s, h) => s + netOf(h.grossCents, h.contribs), 0) / closed.length : 0
  const avgWeeklyContribs =
    closed.length > 0 ? closed.reduce((s, h) => s + h.contribs, 0) / closed.length : 0

  const daysLeft = Math.max(0, Math.ceil((departureDate().getTime() - Date.now()) / 86_400_000))
  const weeksLeft = weeksRemaining(daysLeft)

  const floorOf = (n: number) =>
    n >= TARGETS.jackpot ? 'jackpot' : n >= TARGETS.real ? 'real' : n >= TARGETS.floor ? 'floor' : 'below_floor'

  return Response.json(
    {
      week,
      // Mismo estado que ve la página, para poder comparar de un vistazo.
      journey: journeyState({ grams: totalGrams, people: contribTotal }),
      seed: { grams: SEED_GRAMS, people: SEED_PEOPLE, note: 'aportes previos a la página, sumados al leer' },
      departure: departureDate().toISOString(),

      // La meta de personas es interna y nunca sale a la página.
      goal: {
        targetPeople: TARGET_PEOPLE,
        peopleSoFar: SEED_PEOPLE + contribTotal,
        pctOfTarget: Math.round(((SEED_PEOPLE + contribTotal) / TARGET_PEOPLE) * 1000) / 10,
      },

      grams: { total: totalGrams, week: weekGrams },
      gross: { totalUsd: usd(grossTotal), weekUsd: usd(grossWeek) },
      netEstimated: { totalUsd: usd(netTotal), weekUsd: usd(netWeek) },
      contributions: { total: contribTotal, week: contribWeek },

      /**
       * El ticket promedio real, sin comparar contra ninguna estimación. Con
       * montos libres, cómo evoluciona semana a semana es la única pregunta que
       * tiene sentido: `history` de abajo tiene las tres anteriores.
       */
      avgTicket: {
        grossTotalUsd: contribTotal > 0 ? usd(grossTotal / contribTotal) : 0,
        netTotalUsd: contribTotal > 0 ? usd(netTotal / contribTotal) : 0,
        netWeekUsd: contribWeek > 0 ? usd(netWeek / contribWeek) : 0,
      },

      // Echo de la configuración, para verificar que las env vars llegaron.
      config: {
        kv: describeKvEnv(),
        kofiPct: KOFI_PCT,
        paypalPct: PAYPAL_PCT,
        paypalFixedUsd: usd(PAYPAL_FIXED_CENTS),
      },

      floor: {
        weekContributions: contribWeek,
        reached: floorOf(contribWeek),
        targets: TARGETS,
      },

      projection: {
        daysRemaining: daysLeft,
        weeksRemaining: weeksLeft,
        basedOnWeeks: closed.length,
        avgWeeklyNetUsd: usd(avgWeeklyNet),
        avgWeeklyContributions: Math.round(avgWeeklyContribs * 10) / 10,
        projectedNetUsd: usd(avgWeeklyNet * weeksLeft),
      },

      distribution: {
        shareGenerated,
        // Revelaciones de /open. Es mayor que los aportes: la URL es abierta a
        // propósito y cualquiera puede sacar un sticker sin pagar.
        stickersHandedOut,
        // Si baja de 0,3 el problema es la tarjeta, no el tráfico.
        sharesPerContribution: contribTotal > 0 ? Math.round((shareGenerated / contribTotal) * 100) / 100 : null,
        healthy: contribTotal > 0 ? shareGenerated / contribTotal >= 0.3 : null,
      },

      // Si esto sube, hay algo mal configurado en Ko-fi: son pagos que entraron
      // en otra moneda y por eso no sumaron gramos.
      alerts: {
        nonUsdPayments: otherCurrency,
        nonUsdIsSuspicious: otherCurrency > 0,
      },

      history,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
