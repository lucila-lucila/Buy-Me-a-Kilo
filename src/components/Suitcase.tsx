import { useId, useMemo } from 'react'

/**
 * Montaje de la valija.
 *
 * Abajo va la onda en SVG, arriba la imagen ilustrada con mix-blend-mode:
 * screen. Como el interior de la ilustración es casi negro, el relleno se ve
 * subir a través de la carcasa; como el borde es brillante, la valija se
 * mantiene nítida.
 *
 * Las medidas de la cavidad están tomadas de hero_suitcase.webp (1024x1024).
 */
const CAVITY = { x: 246, y: 338, w: 536, h: 418, r: 62 }

/** Superficie de la onda: una sinusoide, más ancha que el SVG para poder correrla. */
function wavePath(amplitude: number, wavelength: number, phase: number): string {
  const startX = -512
  const endX = 1536
  const step = 24
  const points: string[] = [`M ${startX} ${CAVITY.y}`]
  for (let x = startX; x <= endX; x += step) {
    const y = CAVITY.y + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
    points.push(`L ${x.toFixed(0)} ${y.toFixed(1)}`)
  }
  points.push(`L ${endX} 1400`, `L ${startX} 1400`, 'Z')
  return points.join(' ')
}

export interface SuitcaseProps {
  /** 0 a 1. Por encima de 1 la valija está en overweight. */
  ratio: number
  overweight?: boolean
  /** La respiración lenta se apaga durante la coreografía de /open. */
  breathing?: boolean
  className?: string
}

export function Suitcase({ ratio, overweight = false, breathing = true, className = '' }: SuitcaseProps) {
  const uid = useId().replace(/:/g, '')
  const back = useMemo(() => wavePath(13, 340, 0), [])
  const front = useMemo(() => wavePath(17, 260, Math.PI * 0.6), [])

  // Pasada la meta el nivel ya no dice nada: la valija está llena y lo que
  // sobra se va por los costados y por abajo.
  const clamped = Math.max(0, Math.min(1, ratio))
  const level = CAVITY.h * (1 - clamped)
  const glow = 0.3 + Math.min(1, clamped) * 0.85 + (overweight ? 0.35 : 0)

  return (
    <div
      className={[
        'suitcase',
        breathing ? 'suitcase--breathing' : '',
        overweight ? 'suitcase--overweight' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--glow' as string]: glow.toFixed(2) }}
    >
      <svg className="suitcase__fill" viewBox="0 0 1024 1024" aria-hidden="true">
        <defs>
          <clipPath id={`cavity-${uid}`}>
            <rect x={CAVITY.x} y={CAVITY.y} width={CAVITY.w} height={CAVITY.h} rx={CAVITY.r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#cavity-${uid})`}>
          <g className="wave-level" style={{ transform: `translateY(${level.toFixed(1)}px)` }}>
            <path className="wave wave--back" d={back} fill="var(--electric)" opacity="0.55" />
            <path className="wave wave--front" d={front} fill="var(--mint)" opacity="0.8" />
          </g>
        </g>
      </svg>

      <img
        className="suitcase__shell blend-screen"
        src="/suitcase/hero_suitcase.webp"
        alt=""
        width={1024}
        height={1024}
        fetchPriority="high"
        decoding="async"
      />

      {overweight && <Spill />}
    </div>
  )
}

/**
 * En overweight se le salen cosas por los costados. No es decoración: es el
 * único momento en el que la página se rompe a propósito, y tiene que leerse
 * de una.
 */
const BLOBS = [
  { cx: 292, cy: 372, r: 44, fill: 'var(--sherbet)', dx: -330, dy: 300, rot: -220, dur: 2.4, delay: 0 },
  { cx: 742, cy: 400, r: 36, fill: 'var(--mint)', dx: 350, dy: 250, rot: 190, dur: 2.7, delay: 0.45 },
  { cx: 268, cy: 470, r: 28, fill: 'var(--bubblegum)', dx: -290, dy: 380, rot: -160, dur: 2.2, delay: 1.05 },
  { cx: 764, cy: 560, r: 52, fill: 'var(--electric)', dx: 320, dy: 330, rot: 240, dur: 3, delay: 1.5 },
  { cx: 452, cy: 344, r: 34, fill: 'var(--paper)', dx: -110, dy: -280, rot: -120, dur: 2.5, delay: 0.75 },
  { cx: 612, cy: 344, r: 24, fill: 'var(--mint)', dx: 170, dy: -320, rot: 150, dur: 2.1, delay: 1.9 },
]

/** Gotas que se descuelgan del canto de abajo: la valija pierde. */
const DRIPS = [
  { x: 300, w: 46, len: 190, dur: 3.1, delay: 0.2 },
  { x: 432, w: 66, len: 268, dur: 3.6, delay: 1.2 },
  { x: 566, w: 38, len: 150, dur: 2.8, delay: 2.1 },
  { x: 656, w: 54, len: 214, dur: 3.3, delay: 0.9 },
]

/** Borde inferior de la carcasa, medido sobre hero_suitcase.webp. */
const BOTTOM = 790

function Spill() {
  return (
    <svg className="spill" viewBox="0 0 1024 1024" aria-hidden="true">
      {DRIPS.map((d, i) => (
        <rect
          key={`d${i}`}
          className="spill__drip"
          x={d.x}
          y={BOTTOM}
          width={d.w}
          height={d.len}
          rx={d.w / 2}
          fill="var(--mint)"
          style={{ animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
        />
      ))}
      {BLOBS.map((b, i) => (
        <circle
          key={`b${i}`}
          className="spill__blob"
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill={b.fill}
          style={{
            ['--dx' as string]: `${b.dx}px`,
            ['--dy' as string]: `${b.dy}px`,
            ['--rot' as string]: `${b.rot}deg`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </svg>
  )
}
