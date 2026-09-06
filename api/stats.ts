/**
 * Dashboard privado. GET /api/stats?key=<STATS_SECRET>
 *
 * Sin key válida devuelve 404 con el mismo cuerpo que un 404 real: no tiene que
 * notarse que el endpoint existe. Nada de lo que sale de acá se muestra nunca
 * en la página pública.
 */
import { pipeline, toInt, describeKvEnv } from './_lib/redis'
import { K } from './_lib/keys'
import { isoWeekKey, previousWeekKeys } from './_lib/week'
import { TIERS, type TierId } from '../src/config/tiers'
import {
  KOFI_PCT,
  PAYPAL_PCT,
  PAYPAL_FIXED_CENTS,
  OVERWEIGHT_SHIPPING_CENTS,
  TIER_PRICE_CENTS,
  EXPECTED_MIX,
  EXPECTED_NET_TICKET_CENTS,
  TARGETS,
  WEEKS_REMAINING,
  netCentsForTier,
} from './_lib/economy'

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
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0)

/**
 * Neto sobre un agregado. El porcentual escala con el bruto; la comisión fija
 * de PayPal es por transacción, así que necesita la cantidad de aportes.
 * `overweightCount` descuenta el envío del sticker físico.
 */
function netOf(grossCents: number, contribs: number, overweightCount: number): number {
  const variable = grossCents * (KOFI_PCT + PAYPAL_PCT)
  const fixed = PAYPAL_FIXED_CENTS * contribs
  const shipping = OVERWEIGHT_SHIPPING_CENTS * overweightCount
  return Math.max(0, Math.round(grossCents - variable - fixed - shipping))
}

export default async function handler(req: Request): Promise<Response> {
  const secret = process.env.STATS_SECRET
  const key = new URL(req.url).searchParams.get('key') ?? ''
  if (!secret || !safeEqual(key, secret)) return NOT_FOUND

  const week = isoWeekKey()
  const prev = previousWeekKeys(3)

  const reads: (string | number)[][] = [
    ['GET', K.totalKilos],
    ['GET', K.weekKilos(week)],
    ['GET', K.grossTotal],
    ['GET', K.grossWeek(week)],
    ['GET', K.contribTotal],
    ['GET', K.contribWeek(week)],
    ['GET', K.grossOther],
    ['GET', K.shareGenerated],
    ['GET', K.stickerSerial],
  ]
  for (const t of TIERS) reads.push(['GET', K.tierTotal(t.kilos)], ['GET', K.tierWeek(t.kilos, week)])
  for (const w of prev) reads.push(['GET', K.grossWeek(w)], ['GET', K.contribWeek(w)], ['GET', K.weekKilos(w)])

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
  const totalKilos = toInt(raw[i++])
  const weekKilos = toInt(raw[i++])
  const grossTotal = toInt(raw[i++])
  const grossWeek = toInt(raw[i++])
  const contribTotal = toInt(raw[i++])
  const contribWeek = toInt(raw[i++])
  const otherCurrency = toInt(raw[i++])
  const shareGenerated = toInt(raw[i++])
  const stickersHandedOut = toInt(raw[i++])

  const tierTotals = {} as Record<TierId, number>
  const tierWeeks = {} as Record<TierId, number>
  for (const t of TIERS) {
    tierTotals[t.id] = toInt(raw[i++])
    tierWeeks[t.id] = toInt(raw[i++])
  }

  const history = prev.map((w) => {
    const gross = toInt(raw[i++])
    const contribs = toInt(raw[i++])
    const kilos = toInt(raw[i++])
    return { week: w, grossCents: gross, contribs, kilos }
  })

  const netTotal = netOf(grossTotal, contribTotal, tierTotals.overweight)
  const netWeek = netOf(grossWeek, contribWeek, tierWeeks.overweight)

  // Proyección al ritmo de las últimas 3 semanas cerradas.
  const closed = history.filter((h) => h.contribs > 0)
  const avgWeeklyNet =
    closed.length > 0
      ? closed.reduce((sum, h) => sum + netOf(h.grossCents, h.contribs, 0), 0) / closed.length
      : 0
  const avgWeeklyContribs =
    closed.length > 0 ? closed.reduce((s, h) => s + h.contribs, 0) / closed.length : 0

  const netTicketWeek = contribWeek > 0 ? Math.round(netWeek / contribWeek) : 0
  const floorOf = (n: number) =>
    n >= TARGETS.jackpot ? 'jackpot' : n >= TARGETS.real ? 'real' : n >= TARGETS.floor ? 'floor' : 'below_floor'

  return Response.json(
    {
      week,
      kilos: { total: totalKilos, week: weekKilos },

      gross: { totalUsd: usd(grossTotal), weekUsd: usd(grossWeek) },
      netEstimated: { totalUsd: usd(netTotal), weekUsd: usd(netWeek) },
      contributions: { total: contribTotal, week: contribWeek },

      avgTicket: {
        grossTotalUsd: contribTotal > 0 ? usd(grossTotal / contribTotal) : 0,
        netTotalUsd: contribTotal > 0 ? usd(netTotal / contribTotal) : 0,
        netWeekUsd: usd(netTicketWeek),
        // Sale de la mezcla esperada y de las comisiones cargadas, siempre.
        expectedNetUsd: usd(EXPECTED_NET_TICKET_CENTS),
        // Desviación de la semana contra el neto promedio esperado (5,66).
        deviationPct:
          contribWeek > 0
            ? Math.round(((netTicketWeek - EXPECTED_NET_TICKET_CENTS) / EXPECTED_NET_TICKET_CENTS) * 1000) / 10
            : null,
      },

      mix: TIERS.map((t) => ({
        tier: t.id,
        label: t.label,
        kilos: t.kilos,
        priceUsd: usd(TIER_PRICE_CENTS[t.id]),
        netPerSaleUsd: usd(netCentsForTier(t.id)),
        countTotal: tierTotals[t.id],
        countWeek: tierWeeks[t.id],
        sharePct: pct(tierTotals[t.id], contribTotal),
        expectedPct: EXPECTED_MIX[t.id] * 100,
        deltaPct: Math.round((pct(tierTotals[t.id], contribTotal) - EXPECTED_MIX[t.id] * 100) * 10) / 10,
      })),

      // Echo de la configuración, para verificar que las env vars llegaron.
      config: {
        kv: describeKvEnv(),
        kofiPct: KOFI_PCT,
        paypalPct: PAYPAL_PCT,
        paypalFixedUsd: usd(PAYPAL_FIXED_CENTS),
        overweightShippingUsd: usd(OVERWEIGHT_SHIPPING_CENTS),
      },

      floor: {
        weekContributions: contribWeek,
        reached: floorOf(contribWeek),
        targets: TARGETS,
      },

      projection: {
        weeksRemaining: WEEKS_REMAINING,
        basedOnWeeks: closed.length,
        avgWeeklyNetUsd: usd(avgWeeklyNet),
        avgWeeklyContributions: Math.round(avgWeeklyContribs * 10) / 10,
        projectedNetUsd: usd(avgWeeklyNet * WEEKS_REMAINING),
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
      // en otra moneda y por eso no sumaron kilos.
      alerts: {
        nonUsdPayments: otherCurrency,
        nonUsdIsSuspicious: otherCurrency > 0,
      },

      history,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
