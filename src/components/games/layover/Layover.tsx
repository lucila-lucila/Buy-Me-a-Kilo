import { memo, useEffect, useRef, useState } from 'react'
import { copy } from '../../../copy'
import { prefersReducedMotion } from '../../../lib/reducedMotion'
import { loadSprite, spriteReady } from '../pack/sprites'
import { PALETA, dibujar, formaDe, type Pais, type Pieza } from './landscape'

/** La partida entera, en segundos. A la mitad se cambia de país. */
const DURACION = 46
const CAMBIO = DURACION / 2

/**
 * La física, medida en altos de pantalla y no en píxeles.
 *
 * Nada de acá puede ir en píxeles fijos. En un teléfono el canvas mide 328 de
 * ancho por 436 de alto, y en una notebook 720 por 581: con números fijos, el
 * cargo que en la notebook se ve venir dos segundos y medio en el teléfono se
 * ve venir uno, y encima hay más alto que recorrer para esquivarlo. El mismo
 * juego se vuelve imposible en la pantalla chica, que es justo la que tiene que
 * andar.
 *
 * Así que la gravedad, el empuje y el tope de velocidad son fracciones del alto
 * del canvas, y la velocidad del paisaje sale de cuántos segundos se quiere que
 * un cargo se vea venir. Con eso, la partida se siente igual en las dos.
 */
/** Altos de pantalla por segundo al cuadrado. Cae siempre. */
const GRAVEDAD = 2.6
/** Mientras se mantiene apretado. Más fuerte que la gravedad: por eso sube. */
const EMPUJE = -3.3
/** Altos de pantalla por segundo. Ni se desploma ni se dispara. */
const V_MAX = 1.2
/** Segundos entre que un cargo entra por el borde y llega a Kilo. */
const AVISO = { korea: 1.9, japan: 1.45 }

/** Dónde vuela Kilo, en fracción del ancho. Fijo: solo se mueve para arriba. */
const KILO_X = 0.24
/** Dónde apoya el fondo. Abajo de eso empieza el primer plano. */
const HORIZONTE = 0.8

/**
 * Layover: volar de Corea a Japón con un solo botón.
 *
 * Deliberadamente distinto de Pack: ahí se piensa, acá se reacciona. Una sola
 * acción —tocar o apretar para subir, soltar para bajar— y nada más.
 *
 * Los gramos de acá tampoco tocan el contador. Es la misma regla de siempre:
 * solo un aporte real mueve el número de la página.
 *
 * El paisaje va dibujado con formas y no con imágenes, porque las dos
 * ilustraciones de ecosistema todavía no existen como archivo. Cuando lleguen,
 * se cambia landscape.ts y el juego no se entera.
 *
 * No hay pantalla de inicio. Al cargar ya se ve el mundo andando y a Kilo
 * flotando: el primer toque arranca la partida. Una pantalla de "play" antes
 * del juego es un paso más entre la persona y lo único que la página tiene
 * para ofrecerle gratis.
 *
 * Va envuelto en memo y espera un `onEnd` estable. El juego vive en la pantalla
 * principal, al lado de un contador que hace tick cada segundo y de un fetch
 * cada treinta: si el padre le cambiara la identidad de `onEnd`, el efecto se
 * volvería a montar y la partida se reiniciaría sola en medio del vuelo.
 */
export const Layover = memo(function Layover({ onEnd }: { onEnd: (grams: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grams, setGrams] = useState(0)
  const [esperando, setEsperando] = useState(true)
  const terminado = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    void loadSprite('/hero/kilo.webp', false)

    let ancho = 0
    let alto = 0
    let kiloY = 0
    let kiloV = 0
    let kiloR = 0
    let subiendo = false
    let transcurrido = 0
    let sumados = 0
    let muerto = false
    let finEn = 0
    let desinflado = 1
    /** Antes del primer toque el mundo anda pero no pasa nada. */
    let jugando = false
    let reloj = 0
    /**
     * Con la preferencia de movimiento reducido puesta, el juego arranca
     * congelado: se pinta un cuadro y el bucle se apaga hasta que alguien lo
     * toca. El juego está ahora en la pantalla principal, y quien pidió que
     * nada se mueva no puede caer en una pantalla con algo corriendo solo.
     */
    const quieto = prefersReducedMotion()

    const paisaje: Pieza[] = []
    /**
     * El cielo. Sin esto, volando alto no se mueve nada en pantalla y el vuelo
     * se lee como una foto: los cargos y los gramos viven en la mitad de abajo
     * y arriba queda medio canvas quieto.
     */
    const estrellas: { x: number; y: number; r: number; a: number }[] = []
    const gramos: { x: number; y: number; r: number; valor: number }[] = []
    const cargos: { x: number; y: number; w: number; h: number }[] = []

    const pais = (): Pais => (transcurrido < CAMBIO ? 'korea' : 'japan')
    const velocidad = () => (ancho * (1 - KILO_X)) / AVISO[pais()]
    /** El paisaje se repite cada tanto: un ciclo un poco más ancho que la vista. */
    const ciclo = () => ancho * 2.2

    /**
     * Dos hileras: la de atrás apoyada en el horizonte y chica, la de adelante
     * apoyada abajo del borde y grande. Separadas de verdad, que si las dos
     * apoyan en el mismo lugar se amontonan y no se lee ninguna.
     */
    const sembrar = () => {
      paisaje.length = 0
      estrellas.length = 0
      const c = ciclo()
      for (let i = 0; i < 24; i++) {
        estrellas.push({
          x: Math.random() * c,
          y: Math.random() * alto * 0.74,
          r: 0.8 + Math.random() * 1.7,
          a: 0.16 + Math.random() * 0.3,
        })
      }
      for (let i = 0; i < 7; i++) {
        paisaje.push({
          capa: 0.35,
          tipo: formaDe('korea', i),
          x: (i / 7) * c + Math.random() * c * 0.05,
          escala: 0.85 + Math.random() * 0.4,
        })
      }
      for (let i = 0; i < 5; i++) {
        paisaje.push({
          capa: 0.85,
          tipo: formaDe('korea', i + 2),
          x: (i / 5) * c + c * 0.1 + Math.random() * c * 0.05,
          escala: 0.9 + Math.random() * 0.45,
        })
      }
    }

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      ancho = r.width
      alto = r.height
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(alto * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      kiloR = Math.max(18, Math.min(ancho, alto) * 0.07)
      if (kiloY === 0) kiloY = alto / 2
      // Antes de la primera medición el canvas mide cero y todo el paisaje
      // quedaría amontonado en x = 0.
      if (paisaje.length === 0 && ancho > 0) sembrar()
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(canvas)

    // ---------------------------------------------------------------- entrada
    const arriba = () => {
      subiendo = true
      if (!jugando && !terminado.current) {
        jugando = true
        setEsperando(false)
        // Con movimiento reducido el bucle estaba apagado: se enciende acá.
        if (raf === 0) {
          previo = performance.now()
          raf = requestAnimationFrame(loop)
        }
      }
    }
    const abajo = () => {
      subiendo = false
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'ArrowUp' && e.key !== 'Enter') return
      e.preventDefault()
      arriba()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'ArrowUp' && e.key !== 'Enter') return
      e.preventDefault()
      abajo()
    }
    canvas.addEventListener('pointerdown', arriba)
    canvas.addEventListener('pointerup', abajo)
    canvas.addEventListener('pointerleave', abajo)
    canvas.addEventListener('keydown', onKeyDown)
    canvas.addEventListener('keyup', onKeyUp)

    // ------------------------------------------------------------ generadores
    let proximoGramo = 0.6
    let proximoCargo = 2
    /**
     * Por dónde se pasa. No se sortea dónde va el cargo: se sortea por dónde se
     * pasa y el cargo se pone al lado.
     *
     * En un teléfono de 360 el cargo aparece por el borde derecho y Kilo vuela
     * al 24% del ancho: hay poco más de un segundo entre que se lo ve y que
     * llega. Si el paso siguiente pudiera estar en cualquier lado, la mitad de
     * las veces no se llegaría, y perder por algo que no se podía esquivar es
     * lo peor que puede hacer un juego de reflejos. Así que el paso nuevo está
     * siempre a tiro del anterior, y los gramos salen sobre esa misma ruta.
     */
    let paso = 0

    /** Un gramo y un cargo en el mismo lugar sería una trampa sin salida. */
    const chocaConGramo = (y: number, h: number) =>
      gramos.some((g) => g.x > ancho * 0.5 && g.y + g.r > y - kiloR && g.y - g.r < y + h + kiloR)

    const soltarCosas = (dt: number) => {
      if (paso === 0) paso = alto / 2
      proximoGramo -= dt
      proximoCargo -= dt

      if (proximoGramo <= 0) {
        proximoGramo = 1.5 + Math.random() * 0.8
        // De a tres y en hilera, cerca del paso: se ven venir, se agarran de una
        // pasada y están sobre el camino y no atrás de un cargo.
        const r = Math.max(7, ancho * 0.016)
        const y = paso + (Math.random() - 0.5) * alto * 0.28
        const curva = (Math.random() - 0.5) * alto * 0.16
        for (let i = 0; i < 3; i++) {
          gramos.push({
            x: ancho + 30 + i * r * 4.5,
            y: Math.max(r * 2, Math.min(alto - r * 2, y + curva * (i / 2))),
            r,
            valor: 5,
          })
        }
      }

      if (proximoCargo <= 0) {
        // Más seguido después del cambio de país: ahí el juego aprieta.
        const intervalo = (pais() === 'korea' ? 1.7 : 1.2) + Math.random() * 0.7
        proximoCargo = intervalo
        const h = alto * (0.12 + Math.random() * 0.18)
        const w = Math.max(26, ancho * 0.05)
        // Lo que Kilo alcanza a recorrer de un cargo al siguiente, tomado por
        // abajo: llega al tope de velocidad pero tarda en arrancar y en frenar.
        const alcance = intervalo * V_MAX * alto * 0.5
        const luz = kiloR * 2.2
        const nuevo = Math.max(luz, Math.min(alto - luz, paso + (Math.random() * 2 - 1) * alcance))
        // El cargo va de un lado del paso. Si de ese lado no entra, del otro.
        const cabeArriba = nuevo - luz - h > 0
        const porArriba = cabeArriba && (Math.random() < 0.5 || nuevo + luz + h > alto)
        const y = porArriba ? nuevo - luz - h : Math.min(alto - h, nuevo + luz)
        if (!chocaConGramo(y, h)) {
          cargos.push({ x: ancho + 40, y, w, h })
          paso = nuevo
        }
      }
    }

    // ----------------------------------------------------------------- dibujo
    const render = () => {
      const col = PALETA[pais()]
      const horizonte = alto * HORIZONTE

      // Opaco primero: abajo va todo en screen y screen sobre transparente
      // devuelve rectángulos negros.
      ctx.fillStyle = '#14091c'
      ctx.fillRect(0, 0, ancho, alto)

      // El cielo de cada país, que es lo que hace el cambio sin cortar: las dos
      // paletas se cruzan durante unos segundos alrededor de la mitad.
      const mezcla = Math.min(1, Math.max(0, (transcurrido - CAMBIO + 2.5) / 5))
      const capas: [Pais, number][] = [
        ['korea', 1 - mezcla],
        ['japan', mezcla],
      ]

      ctx.globalCompositeOperation = 'screen'

      for (const [p, a] of capas) {
        if (a <= 0) continue
        ctx.globalAlpha = a
        ctx.fillStyle = PALETA[p].cielo
        ctx.fillRect(0, 0, ancho, alto)
        // La línea del horizonte: es lo que hace que el fondo se apoye en algo.
        ctx.fillStyle = PALETA[p].horizonte
        ctx.fillRect(0, horizonte, ancho, 1.5)
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = 'rgb(255, 246, 236)'
      for (const e of estrellas) {
        ctx.globalAlpha = e.a
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // El fondo se apoya en el horizonte; el frente, abajo del borde. Primero
      // el de atrás, para que el de adelante lo tape.
      for (const pieza of paisaje) {
        const fondo = pieza.capa < 0.5
        ctx.fillStyle = fondo ? col.lejos : col.cerca
        dibujar(
          ctx,
          pieza.tipo,
          pieza.x,
          fondo ? horizonte : alto * 1.02,
          alto * (fondo ? 0.15 : 0.22) * pieza.escala,
        )
      }

      // Los gramos brillan.
      for (const g of gramos) {
        ctx.beginPath()
        ctx.fillStyle = 'rgba(123, 240, 200, 0.95)'
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
        ctx.fill()
      }

      const k = spriteReady('/hero/kilo.webp', false)
      if (k !== undefined) {
        const lado = kiloR * 3.1 * desinflado
        // Se inclina con lo que está haciendo: para arriba al subir, en picada
        // al caer. Es todo lo que hace falta para que se lea como vuelo.
        const inclinacion = Math.max(-0.42, Math.min(0.5, kiloV / (alto * 1.1)))
        ctx.save()
        ctx.translate(ancho * KILO_X, kiloY)
        ctx.rotate(inclinacion)
        ctx.drawImage(k, -lado / 2, -lado / 2, lado, lado)
        ctx.restore()
      }

      ctx.globalCompositeOperation = 'source-over'

      // Los cargos por exceso de equipaje: lo único que no brilla. Opacos, con
      // el borde duro, del color del fondo. Se leen como un agujero.
      for (const c of cargos) {
        ctx.fillStyle = '#0d0512'
        ctx.strokeStyle = 'rgba(255, 246, 236, 0.45)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(c.x, c.y, c.w, c.h, 6)
        ctx.fill()
        ctx.stroke()
      }
    }

    // ------------------------------------------------------------------ bucle
    let raf = 0
    let previo = performance.now()

    /** El mundo corriendo. Lo mismo en la espera que en la partida. */
    const correrPaisaje = (v: number, dt: number) => {
      const c = ciclo()
      for (const e of estrellas) {
        e.x -= v * 0.12 * dt
        if (e.x < -6) {
          e.x += c
          e.y = Math.random() * alto * 0.74
        }
      }
      for (const pieza of paisaje) {
        pieza.x -= v * pieza.capa * dt
        if (pieza.x < -ancho * 0.4) {
          pieza.x += c
          pieza.tipo = formaDe(pais(), Math.floor(Math.random() * 4))
          pieza.escala = 0.85 + Math.random() * 0.45
        }
      }
    }

    const loop = (ahora: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((ahora - previo) / 1000, 0.05)
      previo = ahora

      // Antes del primer toque: se ve el mundo, no pasa nada. Ni cargos, ni
      // gramos, ni reloj de partida. Y con movimiento reducido, ni eso: un
      // cuadro y el bucle se apaga.
      if (!jugando) {
        if (quieto) {
          render()
          cancelAnimationFrame(raf)
          raf = 0
          return
        }
        reloj += dt
        correrPaisaje(velocidad(), dt)
        const antes = kiloY
        kiloY = alto / 2 + Math.sin(reloj * 1.5) * alto * 0.055
        kiloV = (kiloY - antes) / Math.max(dt, 0.001)
        render()
        return
      }

      if (!muerto) {
        transcurrido += dt
        const v = velocidad()

        kiloV += (subiendo ? EMPUJE : GRAVEDAD) * alto * dt
        const tope = V_MAX * alto
        kiloV = Math.max(-tope, Math.min(tope, kiloV))
        kiloY += kiloV * dt
        // Techo y piso: no se pierde por tocarlos, solo no se puede salir.
        if (kiloY < kiloR) {
          kiloY = kiloR
          kiloV = 0
        }
        if (kiloY > alto - kiloR) {
          kiloY = alto - kiloR
          kiloV = 0
        }

        correrPaisaje(v, dt)
        soltarCosas(dt)
        const kx = ancho * KILO_X

        for (let i = gramos.length - 1; i >= 0; i--) {
          const g = gramos[i]
          g.x -= v * dt
          if (Math.hypot(g.x - kx, g.y - kiloY) < g.r + kiloR * 0.8) {
            sumados += g.valor
            setGrams(sumados)
            gramos.splice(i, 1)
          } else if (g.x < -40) {
            gramos.splice(i, 1)
          }
        }

        for (let i = cargos.length - 1; i >= 0; i--) {
          const c2 = cargos[i]
          c2.x -= v * dt
          // Círculo contra rectángulo: el punto del rectángulo más cercano a
          // Kilo. Generoso a propósito, un 0,72 del radio: perder por un píxel
          // que no se vio es lo peor que puede hacer un juego de reflejos.
          const cx = Math.max(c2.x, Math.min(kx, c2.x + c2.w))
          const cy = Math.max(c2.y, Math.min(kiloY, c2.y + c2.h))
          if (Math.hypot(kx - cx, kiloY - cy) < kiloR * 0.72) {
            muerto = true
            finEn = ahora + 900
          }
          if (c2.x < -80) cargos.splice(i, 1)
        }

        // Se llegó a Japón y se terminó el viaje: también es un final.
        if (transcurrido > DURACION) {
          muerto = true
          finEn = ahora + 500
        }
      } else {
        // Kilo se desinfla despacio.
        desinflado = Math.max(0.2, desinflado - dt * 0.9)
        kiloV = Math.min(V_MAX * alto, kiloV + GRAVEDAD * alto * dt)
        kiloY = Math.min(alto - kiloR, kiloY + kiloV * dt)
      }

      render()

      if (muerto && ahora > finEn && !terminado.current) {
        terminado.current = true
        cancelAnimationFrame(raf)
        onEnd(sumados)
      }
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', arriba)
      canvas.removeEventListener('pointerup', abajo)
      canvas.removeEventListener('pointerleave', abajo)
      canvas.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('keyup', onKeyUp)
    }
  }, [onEnd])

  return (
    <div className="game__world">
      <canvas
        className="game__canvas"
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={copy.game.help}
      />
      {/* Encima del canvas y no arriba de él: el juego es el elemento más
          grande de la pantalla y no puede perder alto contra su propio HUD. */}
      <p className="game__score" aria-live="polite">
        {copy.game.packed(grams)}
      </p>
      {esperando && <p className="game__start">{copy.game.tapToPlay}</p>}
    </div>
  )
})

export default Layover
