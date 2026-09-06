/**
 * Cliente REST mínimo para Upstash / Vercel KV. Sin SDK: un fetch y nada más.
 * Acepta los nombres de env var de las dos plataformas.
 */
export class RedisUnavailable extends Error {}

/**
 * Encuentra el par URL + token de la REST API.
 *
 * El acceso ESTÁTICO (process.env.NOMBRE) es el que manda. En el runtime edge de
 * Vercel esos accesos se resuelven en el build; el acceso por índice
 * (process.env[variable]) enumera los nombres pero devuelve undefined al leer el
 * valor. Buscar solo por índice hacía que las credenciales existieran y aun así
 * no se pudieran leer: el contador quedaba en null con las variables bien
 * cargadas.
 *
 * La búsqueda por índice queda como respaldo, para el caso de un prefijo elegido
 * al conectar el store del marketplace, y para el runtime de Node donde sí anda.
 */
const STATIC_PAIRS = [
  {
    urlVar: 'KV_REST_API_URL',
    tokenVar: 'KV_REST_API_TOKEN',
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  },
  {
    urlVar: 'UPSTASH_REDIS_REST_URL',
    tokenVar: 'UPSTASH_REDIS_REST_TOKEN',
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
] as const

const URL_SUFFIXES = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL']

function findCreds(): { url: string; token: string; urlVar: string } | null {
  for (const pair of STATIC_PAIRS) {
    if (pair.url && pair.token) {
      return { url: pair.url.replace(/\/$/, ''), token: pair.token, urlVar: pair.urlVar }
    }
  }

  // Respaldo por índice: cubre los nombres con prefijo.
  for (const urlVar of Object.keys(process.env)) {
    if (!URL_SUFFIXES.some((sfx) => urlVar === sfx || urlVar.endsWith(`_${sfx}`))) continue
    const url = process.env[urlVar]
    // El token de solo lectura no sirve: el webhook necesita escribir.
    const token = process.env[urlVar.replace(/URL$/, 'TOKEN')]
    if (url && token) return { url: url.replace(/\/$/, ''), token, urlVar }
  }
  return null
}

/**
 * Qué ve la función. Nombres y si el valor se puede leer o no, nunca el valor:
 * esto lo devuelve /api/stats, que está detrás de STATS_SECRET.
 *
 * Distinguir el acceso estático del acceso por índice es justamente lo que
 * permite ver el caso en que la variable existe pero su valor no se puede leer.
 */
export function describeKvEnv(): {
  ok: boolean
  usingVar: string | null
  staticAccess: Record<string, 'ok' | 'vacía' | 'ausente'>
  namesInEnv: string[]
  readableByIndex: string[]
  connectionStringOnly: string[]
} {
  const keys = Object.keys(process.env)
  const found = findCreds()

  const staticAccess: Record<string, 'ok' | 'vacía' | 'ausente'> = {}
  for (const pair of STATIC_PAIRS) {
    staticAccess[pair.urlVar] = pair.url === undefined ? 'ausente' : pair.url === '' ? 'vacía' : 'ok'
    staticAccess[pair.tokenVar] =
      pair.token === undefined ? 'ausente' : pair.token === '' ? 'vacía' : 'ok'
  }

  const isKvName = (k: string) => /REST_API_URL$|REST_API_TOKEN$|REDIS_REST_URL$|REDIS_REST_TOKEN$/.test(k)
  return {
    ok: found !== null,
    usingVar: found?.urlVar ?? null,
    staticAccess,
    namesInEnv: keys.filter(isKvName).sort(),
    readableByIndex: keys.filter((k) => isKvName(k) && process.env[k]).sort(),
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
