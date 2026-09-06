/**
 * Cliente REST mínimo para Upstash / Vercel KV. Sin SDK: un fetch y nada más.
 * Acepta los nombres de env var de las dos plataformas.
 */
export class RedisUnavailable extends Error {}

/**
 * Encuentra el par URL + token de la REST API, sin importar cómo se llamen.
 *
 * Vercel deja elegir un prefijo al conectar un store del marketplace, así que
 * las variables pueden llegar como KV_REST_API_URL, UPSTASH_REDIS_REST_URL o
 * cualquiera de esas con un prefijo adelante. Buscar por nombre exacto era
 * frágil: si el prefijo no era el esperado, el contador quedaba en null sin
 * decir por qué.
 */
const URL_SUFFIXES = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL']

function findCreds(): { url: string; token: string; urlVar: string } | null {
  const keys = Object.keys(process.env)
  // Primero los nombres canónicos, después cualquier variante con prefijo.
  const candidates = [
    ...URL_SUFFIXES.filter((k) => process.env[k]),
    ...keys.filter((k) => URL_SUFFIXES.some((sfx) => k !== sfx && k.endsWith(`_${sfx}`))),
  ]

  for (const urlVar of candidates) {
    const url = process.env[urlVar]
    // El token de solo lectura no sirve: el webhook necesita escribir.
    const tokenVar = urlVar.replace(/URL$/, 'TOKEN')
    const token = process.env[tokenVar]
    if (url && token) return { url: url.replace(/\/$/, ''), token, urlVar }
  }
  return null
}

/**
 * Qué se encontró en el entorno. Solo NOMBRES de variables, nunca valores:
 * esto lo devuelve /api/stats para poder diagnosticar sin filtrar credenciales.
 */
export function describeKvEnv(): {
  ok: boolean
  usingVar: string | null
  restVarsFound: string[]
  connectionStringOnly: string[]
} {
  const keys = Object.keys(process.env)
  const found = findCreds()
  return {
    ok: found !== null,
    usingVar: found?.urlVar ?? null,
    restVarsFound: keys.filter((k) => /REST_API_URL$|REST_API_TOKEN$|REDIS_REST_URL$|REDIS_REST_TOKEN$/.test(k)).sort(),
    // Una URL redis:// no sirve desde el runtime edge: hace falta la REST API.
    connectionStringOnly: keys.filter((k) => /^(KV_URL|REDIS_URL)$|_(KV_URL|REDIS_URL)$/.test(k)).sort(),
  }
}

function creds(): { url: string; token: string } {
  const found = findCreds()
  if (!found) throw new RedisUnavailable('kv env missing')
  return { url: found.url, token: found.token }
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
