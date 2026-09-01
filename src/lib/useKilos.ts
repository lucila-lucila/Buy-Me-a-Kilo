import { useEffect, useRef, useState } from 'react'
import { KILOS_POLL_MS } from '../config/goals'

export interface Kilos {
  total: number
  week: number
}

export interface KilosState {
  data: Kilos | null
  /** true cuando el último fetch falló y lo que se ve es el valor anterior. */
  stale: boolean
}

/**
 * El contador es real. Si el endpoint falla se muestra el último valor conocido
 * y se marca como stale; nunca un número inventado.
 */
export function useKilos(): KilosState {
  const [state, setState] = useState<KilosState>({ data: null, stale: false })
  const last = useRef<Kilos | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch('/api/kilos', { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { total: number | null; week: number | null }
        if (!alive) return
        if (typeof json.total === 'number' && typeof json.week === 'number') {
          last.current = { total: json.total, week: json.week }
          setState({ data: last.current, stale: false })
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
