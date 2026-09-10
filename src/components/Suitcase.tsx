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

/** Amplitud máxima de las dos ondas. Define cuánto hay que hundir el nivel. */
const MAX_AMPLITUDE = 17

/**
 * Kilo, adentro de la valija.
 *
 * La caja está en el mismo espacio de 1024 que la cavidad. El dibujo ocupa el
 * 70% de su cuadro (medido: de 152 a 869 en x, de 116 a 903 en y), así que la
 * caja va bastante más grande que el cuerpo que se ve: con estos números el
 * cuerpo mide 260 x 285 y queda parado en el piso de la cavidad, con los pies
 * apenas por debajo de la superficie del líquido.
 *
 * No se mueve con el nivel. El relleno sube por detrás de él.
 */
const KILO = { x: 329, y: 413, size: 371 }

/** De coordenadas de la ilustración a porcentaje de la caja de la valija.
 *  Las capas van de -18% a 118%, así que el 0 de la ilustración cae en -18. */
const toBox = (u: number) => `${(-18 + (u / 1024) * 136).toFixed(2)}%`

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
  const front = useMemo(() => wavePath(MAX_AMPLITUDE, 260, Math.PI * 0.6), [])

  // Pasada la meta el nivel ya no dice nada: la valija está llena y lo que
  // sobra se va por los costados y por abajo.
  const clamped = Math.max(0, Math.min(1, ratio))

  // El recorrido incluye la amplitud de la onda: si no, en cero la superficie
  // queda justo sobre el borde de abajo y solo asoman las crestas, que contra
  // las esquinas redondeadas se leen como dos manchas sueltas en vez de un
  // nivel. Con este offset, en cero no se ve nada.
  const level = (CAVITY.h + MAX_AMPLITUDE) * (1 - clamped)

  // Y la onda se aplana cuando hay poco líquido: una lámina fina tiene que
  // leerse como una línea que cruza todo el ancho, no como olas.
  //
  // Pero no hasta desaparecer. Con `clamped * 4` pelado, al 5,7% la amplitud
  // quedaba en 0,23 —tres píxeles y medio— y después pasaba por dos desenfoques
  // de sigma 7 y 16: una franja plana y borrosa corriéndose de costado, que es
  // indistinguible de una franja quieta. La animación corría, pero no había
  // nada con forma que se pudiera ver moverse. El piso de 0,45 le deja crestas
  // desde el primer gramo.
  const calm = 0.45 + 0.55 * Math.min(1, clamped * 4)

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
    >
      <svg className="suitcase__fill" viewBox="0 0 1024 1024" aria-hidden="true">
        <defs>
          <clipPath id={`cavity-${uid}`}>
            <rect x={CAVITY.x} y={CAVITY.y} width={CAVITY.w} height={CAVITY.h} rx={CAVITY.r} />
          </clipPath>

          {/* Los cuatro colores de la paleta cruzando el líquido en diagonal.
              En userSpaceOnUse el gradiente vive en el espacio de la cavidad, así
              que se desplaza con el nivel en vez de estirarse con la forma. */}
          <linearGradient
            id={`liquid-${uid}`}
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

          {/* Sin bordes duros: la superficie se difumina. El recorte de la
              cavidad va después, así que los costados siguen limpios. */}
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={`softer-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          {/* Para el brillo de la superficie: apenas difuminado, no borrado. */}
          <filter id={`crisp-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <g clipPath={`url(#cavity-${uid})`}>
          {/* El vaivén vertical va en su propio grupo, encima del nivel: el
              nivel se anima con una transición cuando cambian los gramos, y una
              animación infinita en el mismo elemento la pisaría. */}
          <g className="wave-level" style={{ transform: `translateY(${level.toFixed(1)}px)` }}>
            <g className="wave-bob">
              <g
                className="wave-calm"
                style={{ transform: `scaleY(${calm.toFixed(3)})`, transformOrigin: `0 ${CAVITY.y}px` }}
              >
                <path
                  className="wave wave--back"
                  d={back}
                  fill={`url(#liquid-${uid})`}
                  opacity="0.5"
                  filter={`url(#softer-${uid})`}
                />
                <path
                  className="wave wave--front"
                  d={front}
                  fill={`url(#liquid-${uid})`}
                  opacity="0.85"
                  filter={`url(#soft-${uid})`}
                />
                {/* El brillo de la superficie: el mismo path, solo el contorno.
                    Va con un desenfoque mucho más chico que el relleno —el de
                    abajo lo borraba— porque es la única línea con forma
                    definida que cruza la cavidad, y por lo tanto lo único que
                    se ve moverse cuando hay poco líquido. El borde de abajo
                    queda fuera de la cavidad y lo recorta el clip. */}
                <path
                  className="wave wave--shine"
                  d={front}
                  fill="none"
                  stroke="var(--paper)"
                  strokeWidth="5"
                  strokeOpacity="0.6"
                  filter={`url(#crisp-${uid})`}
                />
              </g>
            </g>
          </g>
        </g>
      </svg>

      {/* Entre el relleno y la carcasa: por delante del líquido y por detrás
          del marco, que es lo que lo hace leer como que está adentro. Va con
          blend-screen igual que el resto de las ilustraciones —son negros que
          se vuelven transparentes al mezclar— y con la misma máscara de borde,
          que es la que evita el rectángulo del WebP. */}
      <img
        className="suitcase__kilo blend-screen"
        src="/stickers/webp/sticker_09.webp"
        alt=""
        width={1024}
        height={1024}
        decoding="async"
        style={{ left: toBox(KILO.x), top: toBox(KILO.y), width: `${((KILO.size / 1024) * 136).toFixed(2)}%` }}
        {...({ fetchpriority: 'high' } as Record<string, string>)}
      />

      <img
        className="suitcase__shell blend-screen"
        src="/suitcase/hero_suitcase.webp"
        alt=""
        width={1024}
        height={1024}
        decoding="async"
        // React 18 no conoce fetchPriority en camelCase: lo descarta con un
        // warning. En minúscula pasa derecho al atributo.
        {...({ fetchpriority: 'high' } as Record<string, string>)}
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
