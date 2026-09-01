import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { webpSrc, type Sticker } from '../../config/stickers'
import { useReducedMotion } from '../../lib/reducedMotion'

const PALETTE = ['#FF4FA3', '#3B7BFF', '#FFA24C', '#7BF0C8', '#FFF6EC']
const MAX_TILT = 12

/** Partículas radiales en los colores de la paleta. Las raras tiran más. */
function Particles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const distance = 150 + (i % 3) * 45
        return (
          <motion.span
            key={i}
            className="particle"
            style={{ background: PALETTE[i % PALETTE.length] }}
            initial={{ x: -4, y: -4, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.1, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: (i % 4) * 0.03 }}
          />
        )
      })}
    </>
  )
}

/**
 * Reposo del sticker: tilt 3D siguiendo el mouse, máximo 12 grados. En mobile
 * con el giroscopio si está disponible; si no, queda quieto.
 */
function useTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled) return

    const onPointer = (e: PointerEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      setTilt({
        x: Math.max(-1, Math.min(1, -ny)) * MAX_TILT,
        y: Math.max(-1, Math.min(1, nx)) * MAX_TILT,
      })
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return
      setTilt({
        x: Math.max(-MAX_TILT, Math.min(MAX_TILT, (e.beta - 45) / 3)),
        y: Math.max(-MAX_TILT, Math.min(MAX_TILT, e.gamma / 3)),
      })
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    // Si el permiso no está dado (iOS) simplemente no llega ningún evento.
    window.addEventListener('deviceorientation', onOrientation, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [enabled])

  return { ref, tilt }
}

export function Reveal({ sticker }: { sticker: Sticker }) {
  const reduced = useReducedMotion()
  const { ref, tilt } = useTilt(!reduced)
  const [bloom, setBloom] = useState(!reduced)

  useEffect(() => {
    if (!bloom) return
    const t = window.setTimeout(() => setBloom(false), 400)
    return () => window.clearTimeout(t)
  }, [bloom])

  if (reduced) {
    return (
      <motion.div className="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <img className="reveal__img blend-screen" src={webpSrc(sticker.id)} alt={sticker.alt} width={1024} height={1024} />
      </motion.div>
    )
  }

  return (
    <div className="reveal" ref={ref}>
      {sticker.rarity !== 'common' && (
        <div className={`reveal__aura reveal__aura--${sticker.rarity}`} aria-hidden="true" />
      )}
      <motion.img
        className="reveal__img blend-screen"
        src={webpSrc(sticker.id)}
        alt={sticker.alt}
        width={1024}
        height={1024}
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotateX: tilt.x, rotateY: tilt.y, transformPerspective: 700 }}
        transition={{
          scale: { type: 'spring', stiffness: 260, damping: 12 },
          rotateX: { type: 'spring', stiffness: 120, damping: 18 },
          rotateY: { type: 'spring', stiffness: 120, damping: 18 },
        }}
      />
      <motion.div
        className="reveal__bloom"
        initial={{ opacity: 0.85, scale: 0.4 }}
        animate={{ opacity: 0, scale: 1.3 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <Particles count={sticker.rarity === 'common' ? 12 : 20} />
    </div>
  )
}
