import { memo, useEffect, useRef, useState } from 'react'
import { copy } from '../../../copy'
import { prefersReducedMotion } from '../../../lib/reducedMotion'
import {
  ALTO_CAPA,
  CANTIDAD,
  PALETA,
  PARALAJE,
  formaDe,
  luz,
  silueta,
  type Capa,
  type Pais,
  type Pieza,
} from './landscape'
import { MALOS, MENTA, SPRITES_BUENOS, dibujarMalo, sacar, type Malo } from './objects'
import { cargar, halo, listo } from './sprites'

/** La partida entera, en segundos. A la mitad se cambia de país. */
const DURACION = 46
const CAMBIO = DURACION / 2

/**
 * La física, medida en altos de pantalla y no en píxeles.
 *
 * Nada de acá puede ir en píxeles fijos. En un teléfono el canvas mide 328 de
 * ancho por 333 de alto, y en una notebook 592 por 468: con números fijos, lo
 * que en la notebook se ve venir dos segundos y medio en el teléfono se ve
 * venir uno, y encima hay más alto que recorrer para esquivarlo. El mismo juego
 * se vuelve imposible en la pantalla chica, que es justo la que tiene que andar.
 *
 * Así que la gravedad, el empuje y el tope de velocidad son fracciones del alto
 * del canvas, y la velocidad del mundo sale de cuántos segundos se quiere que
 * una cosa se vea venir. Con eso, la partida se siente igual en las dos.
 */
/** Altos de pantalla por segundo al cuadrado. Cae siempre. */
const GRAVEDAD = 2.6
/** Mientras se mantiene apretado. Más fuerte que la gravedad: por eso sube. */
const EMPUJE = -3.3
/** Altos de pantalla por segundo. Ni se desploma ni se dispara. */
const V_MAX = 1.2
/** Segundos entre que una cosa entra por el borde y llega a Kilo. */
const AVISO = { korea: 1.9, japan: 1.45 }
/** El salto del primer toque, en altos de pantalla por segundo. */
const SALTO = -0.5
/** Segundos que tarda la gravedad en llegar a su valor después de arrancar. */
const GRACIA = 0.6

/** Dónde vuela Kilo, en fracción del ancho. Fijo: solo se mueve para arriba. */
const KILO_X = 0.24
/** Dónde apoya el fondo. Abajo de eso empieza el primer plano. */
const HORIZONTE = 0.78

/** Los colores del cuerpo de Kilo, para la estela. */
const CUERPO: [number, number, number][] = [
  [123, 240, 200],
  [255, 79, 163],
  [59, 123, 255],
]
const BLANCO: [number, number, number] = [255, 246, 236]

interface Bicho {
  x: number
  y: number
  r: number
  gramos: number
  sprite: string
}
interface Peligro {
  x: number
  y: number
  r: number
  tipo: Malo
}
interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
  dur: number
  r: number
  color: [number, number, number]
}
interface Disolucion {
  x: number
  y: number
  r: number
  sprite: string
  vida: number
}
interface Destello {
  x: number
  y: number
  vida: number
}

/**
 * Layover: volar de Corea a Japón con un solo botón.
 *
 * Una sola acción —tocar o apretar para subir, soltar para bajar— y nada más.
 * Se juntan las cosas que entran en la valija, que brillan. Se esquivan las que
 * no entran en ningún avión, que no brillan. Esa es toda la regla.
 *
 * Los gramos de acá no tocan el contador de la página. Solo un aporte real
 * mueve ese número, y esa es la regla que sostiene la página entera.
 *
 * El canvas es transparente: lo que se ve detrás del juego es la página misma,
 * con su resplandor. Con fondo propio y marco se leía como un iframe pegado.
 *
 * No hay pantalla de inicio. Al cargar ya se ve el mundo andando y a Kilo
 * flotando a media altura: el primer toque arranca la partida y le da un salto,
 * y la gravedad tarda medio segundo en llegar a su valor. Sin eso, el primer
 * toque era un toque, Kilo se desplomaba al piso y ahí se quedaba.
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

    void cargar('/hero/kilo.webp', null)
    for (const s of SPRITES_BUENOS) void cargar(s, MENTA)

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
    /** El cuadro blanco del choque. Uno solo. */
    let flash = false
    /** Cuánto del mundo sigue andando. Al chocar baja a cero, despacio. */
    let freno = 1
    /** Si ya se corrió la cortina de país sobre lo que estaba fuera de vista. */
    let cambiado = false
    let proximaEstela = 0
    /**
     * Con la preferencia de movimiento reducido puesta, el juego arranca
     * congelado: se pinta un cuadro y el bucle se apaga hasta que alguien lo
     * toca. El juego está en la pantalla principal, y quien pidió que nada se
     * mueva no puede caer en una pantalla con algo corriendo solo.
     */
    const quieto = prefersReducedMotion()

    const paisaje: Pieza[] = []
    /**
     * El cielo. Sin esto, volando alto no se mueve nada en pantalla y el vuelo
     * se lee como una foto: las cosas viven en la mitad de abajo y arriba queda
     * medio canvas quieto.
     */
    const estrellas: { x: number; y: number; r: number; a: number }[] = []
    const buenos: Bicho[] = []
    const malos: Peligro[] = []
    const particulas: Particula[] = []
    const disoluciones: Disolucion[] = []
    const destellos: Destello[] = []

    /** El país del reloj: el que le toca a lo que entra ahora. */
    const paisReloj = (): Pais => (transcurrido < CAMBIO ? 'korea' : 'japan')
    const velocidad = () => ((ancho * (1 - KILO_X)) / AVISO[paisReloj()]) * freno
    /** El paisaje se repite cada tanto: un ciclo un poco más ancho que la vista. */
    const ciclo = () => ancho * 2.2

    const sembrar = () => {
      paisaje.length = 0
      estrellas.length = 0
      const c = ciclo()
      for (let i = 0; i < 26; i++) {
        estrellas.push({
          x: Math.random() * c,
          y: Math.random() * alto * 0.7,
          r: 0.7 + Math.random() * 1.6,
          a: 0.14 + Math.random() * 0.3,
        })
      }
      for (const capa of [0, 1, 2] as Capa[]) {
        const n = CANTIDAD[capa]
        for (let i = 0; i < n; i++) {
          paisaje.push({
            capa,
            pais: 'korea',
            tipo: formaDe('korea', capa, i),
            x: (i / n) * c + capa * c * 0.07 + Math.random() * c * 0.04,
            escala: 0.85 + Math.random() * 0.4,
          })
        }
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
      kiloR = Math.max(18, Math.min(ancho, alto) * 0.075)
      // Kilo arranca a media altura, y si el canvas cambia de tamaño antes del
      // primer toque —la barra del navegador que aparece y desaparece— se
      // vuelve a centrar en vez de quedarse donde el alto viejo lo dejó.
      if (!jugando) kiloY = alto / 2
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
        kiloV = SALTO * alto
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
    let proximoBueno = 0.5
    let proximoMalo = 2
    /**
     * Por dónde se pasa. No se sortea dónde va lo que se esquiva: se sortea por
     * dónde se pasa y lo que se esquiva se pone al lado.
     *
     * En un teléfono, lo que entra por el borde derecho llega a Kilo en poco
     * más de un segundo. Si el paso siguiente pudiera estar en cualquier lado,
     * la mitad de las veces no se llegaría, y perder por algo que no se podía
     * esquivar es lo peor que puede hacer un juego de reflejos. Así que el paso
     * nuevo está siempre a tiro del anterior, y lo que se junta sale sobre esa
     * misma ruta.
     */
    let paso = 0

    /** Algo bueno y algo malo en el mismo lugar sería una trampa sin salida. */
    const pisaBueno = (y: number, r: number) =>
      buenos.some((b) => b.x > ancho * 0.5 && Math.abs(b.y - y) < b.r + r + kiloR * 1.2)

    const soltarCosas = (dt: number) => {
      if (paso === 0) paso = alto / 2
      proximoBueno -= dt
      proximoMalo -= dt

      if (proximoBueno <= 0) {
        proximoBueno = 1.3 + Math.random() * 0.7
        // De a dos o tres y en hilera, cerca del paso: se ven venir, se agarran
        // de una pasada y están sobre el camino y no atrás de un peligro.
        const y = paso + (Math.random() - 0.5) * alto * 0.26
        const curva = (Math.random() - 0.5) * alto * 0.14
        const n = 2 + Math.floor(Math.random() * 2)
        let x = ancho + kiloR * 1.5
        for (let i = 0; i < n; i++) {
          const b = sacar()
          const r = b.tamaño * kiloR
          buenos.push({
            x,
            y: Math.max(r * 1.4, Math.min(alto - r * 1.4, y + curva * (i / Math.max(1, n - 1)))),
            r,
            gramos: b.gramos,
            sprite: b.sprite,
          })
          x += r * 2 + kiloR * 1.2
        }
      }

      if (proximoMalo <= 0) {
        // Más seguido después del cambio de país, y de a dos: ahí aprieta.
        const japon = paisReloj() === 'japan'
        const intervalo = (japon ? 1.2 : 1.7) + Math.random() * 0.7
        proximoMalo = intervalo
        const r = kiloR * (0.95 + Math.random() * 0.35)
        // Lo que Kilo alcanza a recorrer de un peligro al siguiente, tomado por
        // abajo: llega al tope de velocidad pero tarda en arrancar y en frenar.
        const alcance = intervalo * V_MAX * alto * 0.5
        const aire = kiloR * 2.1
        const nuevo = Math.max(aire, Math.min(alto - aire, paso + (Math.random() * 2 - 1) * alcance))
        const lados: number[] = []
        if (japon) {
          if (nuevo - aire - r > 0) lados.push(nuevo - aire - r)
          if (nuevo + aire + r < alto) lados.push(nuevo + aire + r)
        } else {
          const arribaCabe = nuevo - aire - r > 0
          const abajoCabe = nuevo + aire + r < alto
          if (arribaCabe && (!abajoCabe || Math.random() < 0.5)) lados.push(nuevo - aire - r)
          else if (abajoCabe) lados.push(nuevo + aire + r)
        }
        for (const y of lados) {
          if (pisaBueno(y, r)) continue
          malos.push({ x: ancho + r + 20, y, r, tipo: MALOS[Math.floor(Math.random() * MALOS.length)] })
        }
        paso = nuevo
      }
    }

    // ----------------------------------------------------------------- dibujo
    const dibujarSprite = (img: HTMLCanvasElement, x: number, y: number, lado: number) => {
      ctx.drawImage(img, x - lado / 2, y - lado / 2, lado, lado)
    }

    const render = () => {
      ctx.clearRect(0, 0, ancho, alto)
      const horizonte = alto * HORIZONTE

      // El resplandor del horizonte, en el color del país. Las dos paletas se
      // cruzan durante unos segundos alrededor de la mitad: es el cambio de
      // cielo, y es lo que hace que el cambio no sea un corte.
      const mezcla = Math.min(1, Math.max(0, (transcurrido - CAMBIO + 2) / 4))
      const [r0, g0, b0] = PALETA.korea.horizonte
      const [r1, g1, b1] = PALETA.japan.horizonte
      const hr = Math.round(r0 + (r1 - r0) * mezcla)
      const hg = Math.round(g0 + (g1 - g0) * mezcla)
      const hb = Math.round(b0 + (b1 - b0) * mezcla)
      const g = ctx.createRadialGradient(ancho * 0.5, horizonte, 0, ancho * 0.5, horizonte, ancho * 0.75)
      g.addColorStop(0, `rgba(${hr}, ${hg}, ${hb}, 0.22)`)
      g.addColorStop(0.5, `rgba(${hr}, ${hg}, ${hb}, 0.07)`)
      g.addColorStop(1, `rgba(${hr}, ${hg}, ${hb}, 0)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, ancho, alto)
      // El suelo: del horizonte para abajo, un poco del color del país que se
      // apaga hacia el borde. Sin esto las siluetas terminaban en una recta
      // dura a la altura del horizonte y el paisaje se leía como una mesa.
      const suelo = ctx.createLinearGradient(0, horizonte, 0, alto)
      suelo.addColorStop(0, `rgba(${hr}, ${hg}, ${hb}, 0.16)`)
      suelo.addColorStop(1, `rgba(${hr}, ${hg}, ${hb}, 0)`)
      ctx.fillStyle = suelo
      ctx.fillRect(0, horizonte, ancho, alto - horizonte)
      // Y la línea, tenue: es lo que hace que el fondo se apoye en algo.
      ctx.fillStyle = `rgba(${hr}, ${hg}, ${hb}, 0.28)`
      ctx.fillRect(0, horizonte, ancho, 1)

      ctx.fillStyle = `rgb(${BLANCO.join(',')})`
      for (const e of estrellas) {
        ctx.globalAlpha = e.a
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Las tres capas, de atrás para adelante. Cada pieza con el color de su
      // propio país: al cambiar, lo que sigue en pantalla sigue siendo Corea.
      for (const capa of [0, 1, 2] as Capa[]) {
        const base = capa === 2 ? alto * 1.02 : horizonte + alto * 0.012
        for (const pieza of paisaje) {
          if (pieza.capa !== capa) continue
          const pal = PALETA[pieza.pais]
          const s = alto * ALTO_CAPA[capa] * pieza.escala
          ctx.fillStyle = pal.capa[capa]
          silueta(ctx, pieza.tipo, pieza.x, base, s)
          if (capa > 0) {
            ctx.fillStyle = pal.luz
            luz(ctx, pieza.tipo, pieza.x, base, s)
          }
        }
      }

      // Lo que se acaba de juntar se disuelve hacia arriba.
      for (const d of disoluciones) {
        const img = listo(d.sprite, MENTA)
        if (img === undefined) continue
        const t = d.vida / 0.5
        ctx.globalAlpha = t
        dibujarSprite(img, d.x, d.y, d.r * 2.2 * (1.4 - t * 0.4))
      }
      ctx.globalAlpha = 1

      // Lo que se junta brilla: un halo y la silueta luminosa.
      const haloMenta = halo(MENTA)
      for (const b of buenos) {
        dibujarSprite(haloMenta, b.x, b.y, b.r * 4.2)
        const img = listo(b.sprite, MENTA)
        if (img !== undefined) dibujarSprite(img, b.x, b.y, b.r * 2.2)
      }

      // Lo que se esquiva no brilla. Opaco, borde duro, rojo apagado.
      for (const m of malos) dibujarMalo(ctx, m.tipo, m.x, m.y, m.r)

      // La estela, detrás de Kilo.
      for (const p of particulas) {
        const t = p.vida / p.dur
        ctx.globalAlpha = t * 0.7
        ctx.fillStyle = `rgb(${p.color.join(',')})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (0.5 + t * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const k = listo('/hero/kilo.webp', null)
      if (k !== undefined) {
        const lado = kiloR * 3.1 * desinflado
        const kx = ancho * KILO_X
        ctx.globalAlpha = 0.6
        dibujarSprite(halo(BLANCO), kx, kiloY, lado * 1.5)
        ctx.globalAlpha = 1
        // Se inclina con lo que está haciendo: para arriba al subir, en picada
        // al caer. Es todo lo que hace falta para que se lea como vuelo.
        const inclinacion = Math.max(-0.42, Math.min(0.5, kiloV / (alto * 1.1)))
        ctx.save()
        ctx.translate(kx, kiloY)
        ctx.rotate(inclinacion)
        ctx.drawImage(k, -lado / 2, -lado / 2, lado, lado)
        ctx.restore()
      }

      // El destello del contacto: un anillo que se abre y se apaga.
      for (const d of destellos) {
        const t = d.vida / 0.28
        ctx.globalAlpha = t
        ctx.strokeStyle = `rgb(${MENTA.join(',')})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(d.x, d.y, kiloR * (0.5 + (1 - t) * 1.3), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // El cuadro blanco del choque. Uno solo: nada de sacudir la pantalla.
      if (flash) {
        flash = false
        ctx.fillStyle = 'rgba(255, 246, 236, 0.85)'
        ctx.fillRect(0, 0, ancho, alto)
      }
    }

    // ------------------------------------------------------------------ bucle
    let raf = 0
    let previo = performance.now()

    /** El mundo corriendo. Lo mismo en la espera que en la partida. */
    const correrPaisaje = (v: number, dt: number) => {
      const c = ciclo()
      for (const e of estrellas) {
        e.x -= v * 0.1 * dt
        if (e.x < -6) {
          e.x += c
          e.y = Math.random() * alto * 0.7
        }
      }
      // La cortina: en el momento del cambio, todo lo que todavía no entró en
      // pantalla pasa a ser Japón. Lo que ya se ve sigue siendo Corea hasta que
      // sale. Así el cambio es limpio, por capa, de derecha a izquierda.
      if (!cambiado && transcurrido >= CAMBIO) {
        cambiado = true
        for (const pieza of paisaje) {
          if (pieza.x > ancho + alto * 0.6) {
            pieza.pais = 'japan'
            pieza.tipo = formaDe('japan', pieza.capa, Math.floor(Math.random() * 5))
          }
        }
      }
      for (const pieza of paisaje) {
        pieza.x -= v * PARALAJE[pieza.capa] * dt
        if (pieza.x < -ancho * 0.5) {
          pieza.x += c
          pieza.pais = paisReloj()
          pieza.tipo = formaDe(pieza.pais, pieza.capa, Math.floor(Math.random() * 5))
          pieza.escala = 0.85 + Math.random() * 0.4
        }
      }
    }

    const envejecer = (dt: number) => {
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i]
        p.vida -= dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.vida <= 0) particulas.splice(i, 1)
      }
      for (let i = disoluciones.length - 1; i >= 0; i--) {
        const d = disoluciones[i]
        d.vida -= dt
        d.y -= alto * 0.35 * dt
        if (d.vida <= 0) disoluciones.splice(i, 1)
      }
      for (let i = destellos.length - 1; i >= 0; i--) {
        destellos[i].vida -= dt
        if (destellos[i].vida <= 0) destellos.splice(i, 1)
      }
    }

    const loop = (ahora: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((ahora - previo) / 1000, 0.05)
      previo = ahora

      // Antes del primer toque: se ve el mundo, no pasa nada. Ni peligros, ni
      // cosas que juntar, ni reloj de partida. Y con movimiento reducido, ni
      // eso: un cuadro y el bucle se apaga.
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
        kiloY = alto / 2 + Math.sin(reloj * 1.5) * alto * 0.05
        kiloV = (kiloY - antes) / Math.max(dt, 0.001)
        render()
        return
      }

      const kx = ancho * KILO_X

      if (!muerto) {
        transcurrido += dt
        const v = velocidad()

        // La gravedad entra en medio segundo: el primer toque tiene que ser un
        // salto, no una caída.
        const gravedad = GRAVEDAD * Math.min(1, transcurrido / GRACIA)
        kiloV += (subiendo ? EMPUJE : gravedad) * alto * dt
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

        // La estela, solo al subir. Pocas, suaves, del color del cuerpo.
        if (subiendo) {
          proximaEstela -= dt
          if (proximaEstela <= 0) {
            proximaEstela = 0.04
            particulas.push({
              x: kx - kiloR * 0.7,
              y: kiloY + kiloR * (0.3 + Math.random() * 0.6),
              vx: -v * 0.35 - 10,
              vy: alto * (0.08 + Math.random() * 0.12),
              vida: 0.5,
              dur: 0.5,
              r: kiloR * (0.1 + Math.random() * 0.12),
              color: CUERPO[Math.floor(Math.random() * CUERPO.length)],
            })
          }
        }

        correrPaisaje(v, dt)
        soltarCosas(dt)

        for (let i = buenos.length - 1; i >= 0; i--) {
          const b = buenos[i]
          b.x -= v * dt
          if (Math.hypot(b.x - kx, b.y - kiloY) < b.r + kiloR * 0.85) {
            sumados += b.gramos
            setGrams(sumados)
            destellos.push({ x: b.x, y: b.y, vida: 0.28 })
            disoluciones.push({ x: b.x, y: b.y, r: b.r, sprite: b.sprite, vida: 0.5 })
            buenos.splice(i, 1)
          } else if (b.x < -b.r * 3) {
            buenos.splice(i, 1)
          }
        }

        for (let i = malos.length - 1; i >= 0; i--) {
          const m = malos[i]
          m.x -= v * dt
          // Generoso a propósito: perder por un píxel que no se vio es lo peor
          // que puede hacer un juego de reflejos.
          if (Math.hypot(m.x - kx, m.y - kiloY) < m.r * 0.78 + kiloR * 0.72) {
            muerto = true
            flash = true
            finEn = ahora + 1300
          }
          if (m.x < -m.r * 3) malos.splice(i, 1)
        }

        // Se llegó a Japón y se terminó el viaje: también es un final.
        if (transcurrido > DURACION) {
          muerto = true
          finEn = ahora + 600
        }
      } else {
        // Kilo se desinfla despacio y el mundo frena. Nada de sacudir nada.
        desinflado = Math.max(0.25, desinflado - dt * 0.75)
        freno = Math.max(0, freno - dt / 0.9)
        kiloV = Math.min(V_MAX * alto, kiloV + GRAVEDAD * alto * dt)
        kiloY = Math.min(alto - kiloR, kiloY + kiloV * dt)
        const v = velocidad()
        correrPaisaje(v, dt)
        for (const b of buenos) b.x -= v * dt
        for (const m of malos) m.x -= v * dt
      }

      envejecer(dt)
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
