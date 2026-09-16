/**
 * Carga y prepara los dibujos una sola vez.
 *
 * Las siluetas se pre-renderizan a un canvas aparte con el filtro ya aplicado,
 * en vez de poner ctx.filter en cada cuadro: el filtro por cuadro y por objeto
 * cuesta caro y con veinte bichos en pantalla se nota.
 */
const cache = new Map<string, HTMLCanvasElement>()
const pendientes = new Map<string, Promise<HTMLCanvasElement>>()

const LADO = 256

function preparar(img: HTMLImageElement, silueta: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = LADO
  c.height = LADO
  const ctx = c.getContext('2d')
  if (ctx !== null) {
    // En silueta los que no son suyos: se ve qué forma tienen, no de qué color
    // son. El color es de quien ya tiene el sticker.
    if (silueta) ctx.filter = 'grayscale(1) brightness(1.15) contrast(1.1)'
    ctx.drawImage(img, 0, 0, LADO, LADO)
  }
  return c
}

export function loadSprite(src: string, silueta: boolean): Promise<HTMLCanvasElement> {
  const key = `${src}|${silueta ? 'gris' : 'color'}`
  const listo = cache.get(key)
  if (listo) return Promise.resolve(listo)

  const enCurso = pendientes.get(key)
  if (enCurso) return enCurso

  const promesa = new Promise<HTMLCanvasElement>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const c = preparar(img, silueta)
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

export const spriteReady = (src: string, silueta: boolean): HTMLCanvasElement | undefined =>
  cache.get(`${src}|${silueta ? 'gris' : 'color'}`)
