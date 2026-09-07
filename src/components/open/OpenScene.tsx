import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { copy } from '../../copy'
import { rollSticker } from '../../lib/roll'
import { addToCollection, distinctCount, readCollection } from '../../lib/collection'
import { downloadSticker } from '../../lib/shareCard'
import { claimSerial, formatSerial } from '../../lib/serial'
import { useKilos } from '../../lib/useKilos'
import { useReducedMotion } from '../../lib/reducedMotion'
import { byId, type Sticker } from '../../config/stickers'
import { Suitcase } from '../Suitcase'
import { Reveal } from './Reveal'
import { ShareButton } from './ShareButton'

/**
 * La única coreografía orquestada de la página.
 *
 * /open es una URL adivinable y alguien puede sacar stickers gratis. Es a
 * propósito: un flujo que puede fallar después de que alguien pagó es mucho
 * peor que un sticker filtrado. Nada de tokens de un solo uso.
 */
type Phase = 'fill' | 'bag' | 'shake' | 'burst' | 'reveal'

/**
 * En desarrollo se puede fijar qué sticker sale: /open?sticker=sticker_12.
 * Sirve para revisar la rara, la maldita y el duplicado sin tirar veinte veces.
 * La rama entera desaparece del bundle de producción: import.meta.env.DEV se
 * reemplaza por false en el build y rollup se lleva el bloque muerto.
 */
function pickSticker(): Sticker {
  if (import.meta.env.DEV) {
    const forced = byId(new URLSearchParams(window.location.search).get('sticker') ?? '')
    if (forced) return forced
  }
  return rollSticker()
}

const TIMELINE: [Phase, number][] = [
  ['bag', 1300],
  ['shake', 1650],
  ['burst', 2450],
  ['reveal', 2750],
]

export default function OpenScene() {
  const reduced = useReducedMotion()
  const { data } = useKilos()
  const [phase, setPhase] = useState<Phase>(reduced ? 'reveal' : 'fill')

  // Una sola tirada por visita, decidida en el cliente. StrictMode monta dos
  // veces en dev, así que la tirada y el guardado van tras un ref.
  const rolled = useRef<{ sticker: Sticker; duplicate: boolean; owned: number } | null>(null)
  if (rolled.current === null) {
    const sticker = pickSticker()
    rolled.current = { sticker, duplicate: false, owned: 0 }
  }
  const saved = useRef(false)
  const [result, setResult] = useState(rolled.current)
  const [serial, setSerial] = useState<number | null>(null)

  useEffect(() => {
    if (saved.current) return
    saved.current = true
    const { duplicate } = addToCollection(rolled.current!.sticker.id)
    setResult({ sticker: rolled.current!.sticker, duplicate, owned: distinctCount(readCollection()) })
    void claimSerial(rolled.current!.sticker.id).then(setSerial)
  }, [])

  useEffect(() => {
    if (reduced) return
    const timers = TIMELINE.map(([next, at]) => window.setTimeout(() => setPhase(next), at))
    return () => timers.forEach(window.clearTimeout)
  }, [reduced])

  const { sticker, duplicate, owned } = result
  const total = data?.kilosTotal ?? null
  const percent = data?.percentFull ?? 0
  const revealed = phase === 'reveal'

  const line = useMemo(() => {
    if (!revealed) return phase === 'fill' ? copy.open.filling : copy.open.shaking
    return duplicate ? copy.open.duplicate : copy.open.rarity[sticker.rarity]
  }, [revealed, phase, duplicate, sticker.rarity])

  return (
    <main className="open">
      <div className="stage">
        <AnimatePresence mode="wait">
          {phase === 'fill' && (
            <motion.div
              key="suitcase"
              style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              <Suitcase
                ratio={percent / 100}
                breathing={false}
                overweight={percent > 100}
                className="suitcase--stage"
              />
            </motion.div>
          )}

          {(phase === 'bag' || phase === 'shake' || phase === 'burst') && (
            <motion.img
              key={phase === 'burst' ? 'burst' : 'closed'}
              className={`bag blend-screen${phase === 'shake' ? ' bag--shaking' : ''}`}
              src={phase === 'burst' ? '/bag/bag_burst.webp' : '/bag/bag_closed.webp'}
              alt=""
              width={1024}
              height={1024}
              initial={{ scale: phase === 'bag' ? 0.6 : 1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          )}

          {revealed && (
            <motion.div
              key="reveal"
              style={{ width: '100%', height: '100%' }}
              className={duplicate ? 'reveal--duplicate' : undefined}
            >
              <Reveal sticker={sticker} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="open__line" aria-live="polite">
        {line}
      </p>

      {revealed && (
        <>
          <p className="open__sub">
            {copy.open.collection(owned)}
            {serial !== null && <> · <span className="open__serial">{formatSerial(serial)}</span></>}
          </p>

          <div className="actions">
            <ShareButton
              sticker={sticker}
              totalKilos={total}
              serial={serial}
            />
            <button className="btn" onClick={() => void downloadSticker(sticker.id)}>
              {copy.open.download}
            </button>
          </div>

          <a className="open__link" href="/">
            {copy.open.back}
          </a>
        </>
      )}
    </main>
  )
}
