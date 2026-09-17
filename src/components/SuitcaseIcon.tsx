import { useId } from 'react'

/**
 * La valija de siempre, chiquita, al lado de la barra.
 *
 * Es la misma ilustración que estaba en el hero —hero_suitcase.webp, con la
 * carcasa en mix-blend-mode: screen y el relleno debajo, recortado a la
 * cavidad— escalada a un ícono. Lo que la barra dice en abstracto, esto lo
 * dice de un vistazo.
 *
 * Sin onda, sin glow, sin respirar y sin derrame: el relleno es un rectángulo
 * plano que sube, con la misma transición que la barra para que los dos se
 * muevan juntos. Lee el mismo `percentFull`: si alguna vez el dibujo y el
 * número no coinciden, es un bug. Pasado el 100% se queda llena.
 *
 * Las medidas de la cavidad son las de Suitcase.tsx, tomadas del archivo.
 */
const CAVITY = { x: 246, y: 338, w: 536, h: 418, r: 62 }

export function SuitcaseIcon({ percent }: { percent: number }) {
  const uid = useId().replace(/:/g, '')
  const ratio = Math.min(1, Math.max(0, percent / 100))
  const alto = CAVITY.h * ratio

  return (
    <div className="suitcase-mini" aria-hidden="true">
      <svg className="suitcase-mini__fill" viewBox="0 0 1024 1024">
        <defs>
          <clipPath id={`mini-cavity-${uid}`}>
            <rect x={CAVITY.x} y={CAVITY.y} width={CAVITY.w} height={CAVITY.h} rx={CAVITY.r} />
          </clipPath>
          {/* Los mismos colores del líquido de la ilustración grande. */}
          <linearGradient
            id={`mini-liquid-${uid}`}
            gradientUnits="userSpaceOnUse"
            x1={CAVITY.x}
            y1={CAVITY.y + CAVITY.h}
            x2={CAVITY.x + CAVITY.w}
            y2={CAVITY.y}
          >
            <stop offset="0" style={{ stopColor: 'var(--bubblegum)' }} />
            <stop offset="0.36" style={{ stopColor: 'var(--electric)' }} />
            <stop offset="0.7" style={{ stopColor: 'var(--mint)' }} />
            <stop offset="1" style={{ stopColor: 'var(--sherbet)' }} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#mini-cavity-${uid})`}>
          <rect
            className="suitcase-mini__level"
            x={CAVITY.x}
            y={CAVITY.y + CAVITY.h - alto}
            width={CAVITY.w}
            height={alto}
            fill={`url(#mini-liquid-${uid})`}
          />
        </g>
      </svg>
      <img
        className="suitcase-mini__shell blend-screen"
        src="/suitcase/hero_suitcase.webp"
        alt=""
        width={1024}
        height={1024}
        decoding="async"
      />
    </div>
  )
}
