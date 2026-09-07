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
  departed: boolean
}

export interface KilosState {
  data: Journey | null
  /** true cuando el último fetch falló y lo que se ve es el valor anterior. */
  stale: boolean
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
    departed: j.departed === true,
  }
}

/**
 * El contador es real y monótono. Si el endpoint falla se muestra el último
 * valor conocido y se marca como stale; nunca un número inventado, y nunca uno
 * que baje.
 */
export function useKilos(): KilosState {
  const [state, setState] = useState<KilosState>({ data: null, stale: false })
  const last = useRef<Journey | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch('/api/kilos', { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(String(res.status))
        const parsed = parse(await res.json())
        if (!alive) return
        if (parsed) {
          last.current = parsed
          setState({ data: parsed, stale: false })
        } else {
          setState({ data: last.current, stale: last.current !== null })
        }
      } catch {
        if (!alive) return
        setState({ data: last.current, stale: last.current !== null })
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
