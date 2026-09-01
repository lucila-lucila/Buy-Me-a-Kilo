/**
 * Cliente REST mínimo para Upstash / Vercel KV. Sin SDK: un fetch y nada más.
 * Acepta los nombres de env var de las dos plataformas.
 */
const URL_ENV = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const TOKEN_ENV = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export class RedisUnavailable extends Error {}

function creds(): { url: string; token: string } {
  if (!URL_ENV || !TOKEN_ENV) throw new RedisUnavailable('kv env missing')
  return { url: URL_ENV.replace(/\/$/, ''), token: TOKEN_ENV }
}

async function call(body: unknown): Promise<unknown> {
  const { url, token } = creds()
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new RedisUnavailable(`kv http ${res.status}`)
  return res.json()
}

/** Un comando suelto. Devuelve `result` crudo. */
export async function cmd(...args: (string | number)[]): Promise<unknown> {
  const out = (await call(args.map(String))) as { result?: unknown; error?: string }
  if (out.error) throw new RedisUnavailable(out.error)
  return out.result ?? null
}

/** Varios comandos en un solo round trip. */
export async function pipeline(cmds: (string | number)[][]): Promise<unknown[]> {
  const { url, token } = creds()
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds.map((c) => c.map(String))),
    cache: 'no-store',
  })
  if (!res.ok) throw new RedisUnavailable(`kv http ${res.status}`)
  const out = (await res.json()) as { result?: unknown; error?: string }[]
  return out.map((r) => (r.error ? null : (r.result ?? null)))
}

export function toInt(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '0'), 10)
  return Number.isFinite(n) ? n : 0
}
