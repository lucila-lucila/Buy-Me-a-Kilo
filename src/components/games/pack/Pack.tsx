import { useEffect, useRef, useState } from 'react'
import { copy } from '../../../copy'

/**
 * Pack está apagado —`ready: false` en el catálogo— y no entra en el build.
 * Su única línea de texto vive acá y no en copy.ts: la página de hoy tiene un
 * solo juego, y el texto de un juego que no se muestra no tiene por qué ocupar
 * lugar en el archivo de textos.
 */
const AYUDA = 'drag or use the arrows. drop it in the suitcase.'
import { buildBag, pick, type Piece } from './objects'
import { loadSprite, spriteReady } from './sprites'
import { step, lost, wobble, type Body, type Box } from './physics'

/** Medidas de hero_suitcase.webp, en su espacio de 1024. */
const ART = { top: 202, bottom: 823, left: 166, right: 857 }
const CAVITY = { x0: 246, x1: 782, y0: 338, y1: 756 }

/** Lo que baja la pieza en la mano, por segundo. Es el reloj de la partida. */
const HOVER_FALL = 46
const STEP = 1 / 120

/**
 * Tope duro de piezas. La partida ya termina por desborde o porque algo se fue
 * afuera, pero las dos dependen de que un cuerpo se quede quieto, y un cuerpo
 * que rebota para siempre no se queda quieto nunca. Con esto no hay ninguna
 * forma de que la partida no termine.
 */
const MAX_PIEZAS = 40

/**
 * Pack: apilar lo que cae adentro de la valija.
 *
 * Es la metáfora de la página convertida en acción —empacar hasta que no entra
 * más— y el resultado se mide en gramos, que es la unidad de la página.
 *
 * Los gramos de acá NO tocan el contador. Jugar no llena la valija: solo el
 * webhook de un aporte real mueve el número. Si un juego sumara gramos, el
 * contador dejaría de ser verdadero, y esa es la regla que sostiene todo.
 *
 * Se juega con el dedo, con el mouse y con el teclado: la pieza sigue al
 * puntero y se suelta al levantarlo, o se mueve con las flechas y se suelta con
 * espacio. En teléfono, un toque suelto la pieza donde tocaste.
 */
export function Pack({ onEnd }: { onEnd: (grams: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grams, setGrams] = useState(0)
  const terminado = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    const bag = buildBag()
    const bodies: Body[] = []
    let box: Box = { left: 0, right: 0, rim: 0, floor: 0 }
    let arte = { x: 0, y: 0, size: 0 }
    let ancho = 0
    let alto = 0

    let actual: Piece = pick(bag)
    let manoX = 0
    let manoY = 0
    let tiradas = 0
    let dentro = 0
    let perdido = false
    let finEn = 0

    // La carcasa y Kilo se dibujan todos los cuadros: se piden una sola vez.
    void loadSprite('/suitcase/hero_suitcase.webp', false)
    void loadSprite('/hero/kilo.webp', false)
    // Todos los de la bolsa, en la variante que les toca: dibujar uno que no se
    // pidió con esa variante lo deja invisible.
    for (const p of bag) void loadSprite(p.sprite, !p.own)

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      ancho = r.width
      alto = r.height
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(alto * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // La valija ocupa la mitad de abajo. El tope lo pone el ancho: el dibujo
      // mide 0,675 de su cuadro, y tiene que entrar con márgenes.
      const porAncho = ((ancho - 24) * 1024) / (ART.right - ART.left)
      const porAlto = ((alto * 0.62) * 1024) / (ART.bottom - ART.top)
      const size = Math.min(porAncho, porAlto)
      arte = {
        size,
        x: (ancho - size) / 2,
        y: alto - 10 - (ART.bottom / 1024) * size,
      }
      box = {
        left: arte.x + (CAVITY.x0 / 1024) * size,
        right: arte.x + (CAVITY.x1 / 1024) * size,
        rim: arte.y + (CAVITY.y0 / 1024) * size,
        floor: arte.y + (CAVITY.y1 / 1024) * size,
      }
      manoX = Math.min(Math.max(manoX || ancho / 2, box.left), box.right)
      manoY = Math.min(manoY || 60, box.rim - 40)
    }

    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(canvas)

    const radio = (p: Piece) => p.size * (box.right - box.left)

    /**
     * Los gramos que hay ADENTRO, no los que se tiraron. Lo que se cayó afuera
     * no está empacado, y el número de arriba dice "grams", no "intentos".
     */
    const empacados = () => {
      let total = 0
      for (const b of bodies) {
        if (b.x > box.left && b.x < box.right && b.y > box.rim) total += b.grams
      }
      return total
    }

    const soltar = () => {
      if (perdido) return
      const r = radio(actual)
      bodies.push({
        x: manoX,
        y: manoY,
        vx: 0,
        vy: 120,
        r,
        grams: actual.grams,
        sprite: actual.sprite,
        own: actual.own,
        still: 0,
      })
      tiradas += 1
      actual = pick(bag)
      void loadSprite(actual.sprite, !actual.own)
      manoY = 46
    }

    // ---------------------------------------------------------------- entrada
    const aX = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      manoX = Math.min(Math.max(e.clientX - r.left, box.left + radio(actual)), box.right - radio(actual))
    }
    const onMove = (e: PointerEvent) => aX(e)
    const onUp = (e: PointerEvent) => {
      aX(e)
      soltar()
    }
    const onKey = (e: KeyboardEvent) => {
      const paso = 18
      if (e.key === 'ArrowLeft') manoX = Math.max(manoX - paso, box.left + radio(actual))
      else if (e.key === 'ArrowRight') manoX = Math.min(manoX + paso, box.right - radio(actual))
      else if (e.key === ' ' || e.key === 'Enter') soltar()
      else return
      // Las flechas y el espacio son del juego, no del scroll ni del botón.
      e.preventDefault()
    }

    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('keydown', onKey)

    // ----------------------------------------------------------------- dibujo
    const dibujarSprite = (src: string, silueta: boolean, x: number, y: number, lado: number) => {
      const s = spriteReady(src, silueta)
      if (s === undefined) return
      ctx.drawImage(s, x, y, lado, lado)
    }

    const render = (temblor: number) => {
      // Fondo opaco y no clearRect: el screen de abajo necesita algo con qué
      // mezclarse. Sobre transparente, screen deja el origen tal cual y cada
      // dibujo sale con su rectángulo negro alrededor. Es el mismo error que ya
      // dio cuadrados negros tres veces en la página.
      ctx.fillStyle = '#14091c'
      ctx.fillRect(0, 0, ancho, alto)

      // Todo lo que se dibuja de acá para abajo va en screen: son WebP sobre
      // negro y el negro se vuelve transparente al mezclar, igual que en la
      // página. Kilo incluido: dibujado en source-over salía con su cuadrado
      // negro alrededor.
      ctx.globalCompositeOperation = 'screen'

      // Kilo mira desde el costado y se agranda apenas cuando la pila se mueve.
      const kiloLado = Math.max(56, ancho * 0.17) * (1 + Math.min(temblor / 900, 0.14))
      dibujarSprite('/hero/kilo.webp', false, 8, alto - kiloLado - 6, kiloLado)

      for (const b of bodies) {
        dibujarSprite(b.sprite, !b.own, b.x - b.r * 1.35, b.y - b.r * 1.35, b.r * 2.7)
      }
      if (!perdido) {
        const r = radio(actual)
        dibujarSprite(actual.sprite, !actual.own, manoX - r * 1.35, manoY - r * 1.35, r * 2.7)
      }

      // La carcasa arriba de todo: el interior es casi negro, así que con screen
      // no tapa nada y el marco queda por delante. Eso es lo que hace que los
      // bichos se lean adentro de la valija.
      dibujarSprite('/suitcase/hero_suitcase.webp', false, arte.x, arte.y, arte.size)
      ctx.globalCompositeOperation = 'source-over'
    }

    // ------------------------------------------------------------------ bucle
    let raf = 0
    let previo = performance.now()
    let resto = 0

    const loop = (ahora: number) => {
      raf = requestAnimationFrame(loop)
      // Un tope al dt: si la pestaña estuvo en segundo plano, el salto haría
      // atravesar paredes a todo el mundo.
      const dt = Math.min((ahora - previo) / 1000, 0.05)
      previo = ahora

      if (!perdido) {
        resto += dt
        while (resto >= STEP) {
          step(bodies, box, STEP)
          resto -= STEP
        }

        // La pieza en la mano baja sola: ese es el reloj de la partida. Si llega
        // al borde sin que la suelten, se suelta igual.
        manoY += HOVER_FALL * dt
        if (manoY > box.rim - radio(actual) * 1.1) soltar()

        // lost() ya exige que el cuerpo en falta esté quieto doce cuadros; pedir
        // además que TODA la pila se haya asentado no llegaba nunca, porque
        // siempre hay algo rebotando arriba, y la partida no terminaba.
        dentro = empacados()
        // setGrams con el mismo número no re-renderiza: React corta solo.
        setGrams(dentro)

        const razon = lost(bodies, box, alto)
        if (razon !== null || tiradas >= MAX_PIEZAS) {
          perdido = true
          finEn = ahora + 700
        }
      }

      render(wobble(bodies))

      // Una pausa corta antes del resultado: es la valija cerrándose con lo que
      // entró, y da tiempo a ver dónde se cayó todo.
      if (perdido && ahora > finEn && !terminado.current) {
        terminado.current = true
        cancelAnimationFrame(raf)
        onEnd(dentro)
      }
    }

    raf = requestAnimationFrame(loop)
    canvas.focus()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('keydown', onKey)
    }
  }, [onEnd])

  return (
    <div className="pack">
      <p className="pack__score" aria-live="polite">
        {copy.game.packed(grams)}
      </p>
      <canvas
        className="pack__canvas"
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={AYUDA}
      />
      <p className="pack__help">{AYUDA}</p>
    </div>
  )
}

export default Pack
