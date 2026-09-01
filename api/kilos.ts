/**
 * Lo único que el front puede saber: { total, week }.
 * Sin montos, sin cantidad de aportes, sin metas internas.
 */
import { pipeline, toInt } from './_lib/redis'
import { K } from './_lib/keys'
import { isoWeekKey } from './_lib/week'

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const week = isoWeekKey()
  try {
    const [total, weekly] = await pipeline([
      ['GET', K.totalKilos],
      ['GET', K.weekKilos(week)],
    ])
    return Response.json(
      { total: toInt(total), week: toInt(weekly) },
      {
        headers: {
          // 30s de cache en el edge; si KV se cae, el edge sigue sirviendo el
          // último valor real durante 5 minutos en vez de un número inventado.
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        },
      },
    )
  } catch {
    console.error('kilos: kv no disponible')
    // null explícito: el front deja el último valor que ya tenía en pantalla.
    return Response.json({ total: null, week: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
