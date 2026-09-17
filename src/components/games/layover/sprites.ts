/**
 * Los dibujos del juego, recortados una sola vez.
 *
 * Kilo y los stickers vienen como imágenes sobre fondo negro, hechas para
 * mezclarse con `screen`. Pero `screen` necesita un fondo opaco debajo, y el
 * canvas del juego es transparente a propósito: lo que se ve detrás es la
 * página misma, con su resplandor, y no una caja con su propio fondo.
 *
 * Así que acá se les saca el negro de verdad. Sobre negro, un píxel mezclado
 * con `screen` equivale a ese mismo píxel con alfa igual a su canal más claro;
 * se calcula eso una vez por imagen, al cargar, y de ahí en más se dibujan con
 * `drawImage` común, sobre lo que sea.
 *
 * Los stickers, además, van en silueta de un solo color: se ve qué forma
 * tienen, no de qué color son. El color aparece recién en /open, cuando alguien
 * abre el suyo, y esa sorpresa no se gasta acá.
 */
const LADO = 256

const cache = new Map<string, HTMLCanvasElement>()
const pendientes = new Map<string, Promise<HTMLCanvasElement>>()

/** [r, g, b] del color de la silueta, o null para conservar los colores. */
type Tinte = [number, number, number] | null

function recortar(img: HTMLImageElement, tinte: Tinte): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = LADO
  c.height = LADO
  const ctx = c.getContext('2d')
  if (ctx === null) return c
  ctx.drawImage(img, 0, 0, LADO, LADO)

  const data = ctx.getImageData(0, 0, LADO, LADO)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const max = Math.max(r, g, b)
    if (tinte === null) {
      // El alfa es el canal más claro, y el color se destiñe en proporción para
      // que al componerse sobre el fondo vuelva a dar el píxel original.
      d[i + 3] = max
      if (max > 0) {
        d[i] = Math.min(255, Math.round((r * 255) / max))
        d[i + 1] = Math.min(255, Math.round((g * 255) / max))
        d[i + 2] = Math.min(255, Math.round((b * 255) / max))
      }
    } else {
      // Silueta: todo lo que no es fondo es opaco, con un borde corto para que
      // no quede serruchado. El umbral está en 10 y no en 0 porque la
      // compresión deja el negro en 1, 2, 3.
      d[i + 3] = Math.max(0, Math.min(255, (max - 10) * 7))
      d[i] = tinte[0]
      d[i + 1] = tinte[1]
      d[i + 2] = tinte[2]
    }
  }
  ctx.putImageData(data, 0, 0)
  return c
}

const clave = (src: string, tinte: Tinte) => `${src}|${tinte === null ? 'color' : tinte.join(',')}`

export function cargar(src: string, tinte: Tinte): Promise<HTMLCanvasElement> {
  const key = clave(src, tinte)
  const listo = cache.get(key)
  if (listo) return Promise.resolve(listo)
  const enCurso = pendientes.get(key)
  if (enCurso) return enCurso

  const promesa = new Promise<HTMLCanvasElement>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const c = recortar(img, tinte)
      cache.set(key, c)
      resolve(c)
    }
    // Si un dibujo no carga, se devuelve un canvas vacío: el juego sigue con un
    // hueco en vez de romperse.
    img.onerror = () => {
      const c = document.createElement('canvas')
      c.width = LADO
      c.height = LADO
      cache.set(key, c)
      resolve(c)
    }
    img.src = src
  })
  pendientes.set(key, promesa)
  return promesa
}

export const listo = (src: string, tinte: Tinte): HTMLCanvasElement | undefined =>
  cache.get(clave(src, tinte))

/**
 * Un halo suave, pre-renderizado una vez por color. Se dibuja detrás de todo lo
 * que brilla: hacer un gradiente radial por objeto y por cuadro es lo que hace
 * que un teléfono se caiga a treinta cuadros.
 */
const halos = new Map<string, HTMLCanvasElement>()

export function halo(color: [number, number, number]): HTMLCanvasElement {
  const key = color.join(',')
  const listo = halos.get(key)
  if (listo) return listo
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    const [r, gg, b] = color
    g.addColorStop(0, `rgba(${r}, ${gg}, ${b}, 0.55)`)
    g.addColorStop(0.45, `rgba(${r}, ${gg}, ${b}, 0.18)`)
    g.addColorStop(1, `rgba(${r}, ${gg}, ${b}, 0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  halos.set(key, c)
  return c
}
