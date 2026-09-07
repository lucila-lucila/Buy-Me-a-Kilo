import { useEffect, useRef, useState } from 'react'
import { KILOS_POLL_MS, SUITCASE_CAPACITY_G } from '../config/suitcase'

/** El mismo shape que devuelve /api/kilos. */
export interface Journey {
  gramsTotal: number
  kilosTotal: number
  capacityKilos: number
  peopleTotal: number
  percentFull: number
  daysRemaining: number
  msRemaining: number
  departed: boolean
}

/**
 * El ancla de la cuenta regresiva: cuántos milisegundos faltaban y en qué
 * momento local lo supimos. De ahí en adelante el cliente descuenta con tiempo
 * transcurrido, no con la hora del reloj, así que un dispositivo con la fecha
 * corrida igual muestra bien cuánto falta.
 */
export interface Clock {
  msRemaining: number
  at: number
}

export interface KilosState {
  data: Journey | null
  /** true cuando el último fetch falló y lo que se ve es el valor anterior. */
  stale: boolean
  clock: Clock | null
}

/**
 * Tolerante a que falten campos: /api/kilos tiene 30s de cache en el edge, así
 * que justo después de un deploy puede llegar la respuesta de la versión
 * anterior. Antes que romper, se descarta.
 */
function parse(json: unknown): Journey | null {
  if (!json || typeof json !== 'object') return null
  const j = json as Record<string, unknown>
  const num = (k: string): number | null => (typeof j[k] === 'number' ? (j[k] as number) : null)

  const gramsTotal = num('gramsTotal')
  if (gramsTotal === null) return null

  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    gramsTotal,
    kilosTotal: num('kilosTotal') ?? round1(gramsTotal / 1000),
    capacityKilos: num('capacityKilos') ?? SUITCASE_CAPACITY_G / 1000,
    peopleTotal: num('peopleTotal') ?? 0,
    percentFull: num('percentFull') ?? round1((gramsTotal / SUITCASE_CAPACITY_G) * 100),
    daysRemaining: num('daysRemaining') ?? 0,
    // Si llega una respuesta vieja del cache del edge, sin msRemaining, los
    // días alcanzan para no romper: la precisión vuelve en el próximo fetch.
    msRemaining: num('msRemaining') ?? (num('daysRemaining') ?? 0) * 86_400_000,
    departed: j.departed === true,
  }
}

/**
 * El contador es real y monótono. Si el endpoint falla se muestra el último
 * valor conocido y se marca como stale; nunca un número inventado, y nunca uno
 * que baje.
 */
export function useKilos(): KilosState {
  const [state, setState] = useState<KilosState>({ data: null, stale: false, clock: null })
  const last = useRef<Journey | null>(null)
  const clock = useRef<Clock | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch('/api/kilos', { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(String(res.status))
        // La respuesta puede venir del cache del edge, de hasta 30 segundos (o
        // de cinco minutos si KV se cayó). Age dice de cuánto, y sin restarlo la
        // cuenta regresiva se quedaría clavada esos segundos de más.
        const age = Number(res.headers.get('Age') ?? 0)
        const ageMs = Number.isFinite(age) && age > 0 ? age * 1000 : 0
        const parsed = parse(await res.json())
        if (!alive) return
        if (parsed) {
          last.current = parsed
          clock.current = { msRemaining: Math.max(0, parsed.msRemaining - ageMs), at: Date.now() }
          setState({ data: parsed, stale: false, clock: clock.current })
        } else {
          setState({ data: last.current, stale: last.current !== null, clock: clock.current })
        }
      } catch {
        if (!alive) return
        setState({ data: last.current, stale: last.current !== null, clock: clock.current })
      }
    }

    void load()
    const id = window.setInterval(load, KILOS_POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return state
}
