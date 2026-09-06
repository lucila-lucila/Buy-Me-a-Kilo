/**
 * Número de serie del sticker.
 *
 * Un INCR sobre un entero: devuelve el siguiente número de la serie y no guarda
 * absolutamente nada sobre quién lo pidió. Es el mismo tipo de contador agregado
 * que el resto, así que sigue cumpliendo la regla de no guardar datos.
 *
 * No es un certificado: como nadie registra a quién le tocó cuál, el número no
 * se puede verificar después. Es una marca, y alcanza para que la tarjeta de
 * cada persona sea distinta de la de todas las demás.
 */
import { cmd, toInt, describeKvEnv } from './_lib/redis.js'
import { K } from './_lib/keys.js'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405 })
  try {
    const serial = toInt(await cmd('INCR', K.stickerSerial))
    return Response.json({ serial }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('serial: kv no disponible', JSON.stringify(describeKvEnv()))
    // Sin número antes que un número inventado: la tarjeta sale sin la línea.
    return Response.json({ serial: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
