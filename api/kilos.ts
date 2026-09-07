/**
 * Lo único que el front puede saber del viaje. Sin montos, sin metas internas.
 *
 * El número de valija y los kilos de la actual son derivados, no guardados: dos
 * enteros de KV más el arrastre, y el resto sale de una división. Así no se
 * pueden desincronizar.
 */
import { pipeline, toInt, describeKvEnv } from './_lib/redis.js'
import { K } from './_lib/keys.js'
import { isoWeekKey } from './_lib/week.js'
import { journeyState } from './_lib/journey.js'

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const week = isoWeekKey()
  try {
    const [kilos, weekKilos, people, weekPeople] = await pipeline([
      ['GET', K.totalKilos],
      ['GET', K.weekKilos(week)],
      // Las personas son los aportes, que ya se cuentan. Una clave nueva para lo
      // mismo se desincronizaría el día que una escritura falle.
      ['GET', K.contribTotal],
      ['GET', K.contribWeek(week)],
    ])

    return Response.json(
      journeyState({
        kilos: toInt(kilos),
        people: toInt(people),
        weekKilos: toInt(weekKilos),
        weekPeople: toInt(weekPeople),
      }),
      {
        headers: {
          // 30s de cache en el edge; si KV se cae, el edge sigue sirviendo el
          // último valor real durante 5 minutos en vez de un número inventado.
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        },
      },
    )
  } catch {
    console.error('kilos: kv no disponible', JSON.stringify(describeKvEnv()))
    // null explícito: el front deja el último valor que ya tenía en pantalla.
    return Response.json({ totalKilos: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
