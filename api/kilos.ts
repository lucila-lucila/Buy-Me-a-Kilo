/**
 * Lo único que el front puede saber del viaje. Sin montos, sin metas internas:
 * las 5.200 personas viven solo en el dashboard privado.
 *
 * Todo sale de los gramos totales. Nada se guarda derivado, así que el nivel
 * dibujado y el porcentaje no se pueden desincronizar.
 */
import { pipeline, toInt, describeKvEnv } from './_lib/redis.js'
import { K } from './_lib/keys.js'
import { journeyState } from './_lib/journey.js'

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  try {
    const [grams, people] = await pipeline([
      ['GET', K.totalGrams],
      // Las personas son los aportes, que ya se cuentan desde siempre.
      ['GET', K.contribTotal],
    ])

    return Response.json(journeyState({ grams: toInt(grams), people: toInt(people) }), {
      headers: {
        // 30s de cache en el edge; si KV se cae, el edge sigue sirviendo el
        // último valor real durante 5 minutos en vez de un número inventado.
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
      },
    })
  } catch {
    console.error('kilos: kv no disponible', JSON.stringify(describeKvEnv()))
    // null explícito: el front deja el último valor que ya tenía en pantalla.
    return Response.json({ gramsTotal: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
