import { useState } from 'react'
import { copy } from '../../copy'
import { shareOrDownload } from '../../lib/shareCard'
import type { Sticker } from '../../config/stickers'

/**
 * Sin audiencia propia, cada persona que compra es la distribución. Esto es lo
 * más importante de la página.
 */
export function ShareButton({ sticker, totalKilos }: { sticker: Sticker; totalKilos: number | null }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  const onClick = async () => {
    setState('busy')
    try {
      const outcome = await shareOrDownload({
        stickerId: sticker.id,
        rarity: sticker.rarity,
        totalKilos,
      })
      setState(outcome === 'cancelled' ? 'idle' : 'done')
    } catch {
      setState('idle')
    }
  }

  return (
    <button className="btn btn--primary" onClick={onClick} disabled={state === 'busy'}>
      {state === 'busy' ? copy.open.sharing : state === 'done' ? copy.open.shared : copy.open.share}
    </button>
  )
}
