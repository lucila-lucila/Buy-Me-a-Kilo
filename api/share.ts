/**
 * Contador de tarjetas generadas. Un entero y nada más: sin cuerpo, sin query,
 * sin IP, sin nada que identifique a quien la generó. La relación entre aportes
 * y tarjetas dice si el motor de distribución funciona.
 */
import { cmd } from './_lib/redis.js'
import { K } from './_lib/keys.js'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  try {
    await cmd('INCR', K.shareGenerated)
  } catch {
    // Que no se genere el contador no puede romperle la tarjeta a nadie.
    console.error('share: kv no disponible')
  }
  return new Response(null, { status: 204 })
}
