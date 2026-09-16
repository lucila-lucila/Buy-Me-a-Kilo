#!/usr/bin/env node
/**
 * Genera las imágenes derivadas: la tarjeta para compartir y los íconos.
 *
 *   public/og.png               1200x630, Kilo y la valija
 *   public/apple-touch-icon.png 180x180
 *   public/favicon.png          32x32
 *
 * Las tres salen de public/hero/kilo.webp, así que cuando llegue el archivo
 * definitivo de Kilo alcanza con reemplazarlo y volver a correr esto.
 *
 * Se dibujan en el navegador y no con una librería de imágenes, para que usen
 * las mismas tipografías, la misma paleta y las mismas ilustraciones que la
 * página. Una tarjeta hecha aparte se despega del sitio en la primera semana.
 *
 * La página se escribe en public/ y se abre por el servidor de desarrollo en
 * vez de inyectarse con setContent: así tiene un origen de verdad y las
 * @font-face cargan. Con setContent el documento es about:blank, las
 * tipografías fallan en silencio y la tarjeta sale con la de respaldo.
 *
 * Playwright no es dependencia del proyecto a propósito: son ~150 MB de
 * navegadores en cada deploy para algo que se corre a mano cuando cambia el
 * arte. Antes de usarlo, una vez:
 *
 *   npm i --no-save playwright
 *   npm run dev            (en otra terminal)
 *   npm run images
 */
import { writeFileSync, rmSync } from 'node:fs'

const BASE = process.env.AUDIT_URL ?? 'http://localhost:5173'
const SCRATCH = 'public/__render.html'

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('\nFalta Playwright. Instalalo sin guardarlo:\n\n  npm i --no-save playwright\n')
  process.exit(1)
}

const PALETA = `
  :root {
    --void: #14091c;
    --bubblegum: #ff4fa3;
    --electric: #3b7bff;
    --sherbet: #ffa24c;
    --mint: #7bf0c8;
    --paper: #fff6ec;
    --display: 'Bagel Fat One', system-ui, sans-serif;
    --body: 'Familjen Grotesk', system-ui, sans-serif;
  }
  /* Escritas acá y no importadas de src/: en desarrollo Vite sirve los .css
     como módulos de JavaScript, así que un <link> a fonts.css entra pero no
     aplica, y la tarjeta salía con la tipografía de respaldo. */
  @font-face {
    font-family: 'Bagel Fat One';
    font-style: normal; font-weight: 400; font-display: block;
    src: url('/fonts/bagel-fat-one.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Familjen Grotesk';
    font-style: normal; font-weight: 400 700; font-display: block;
    src: url('/fonts/familjen-grotesk.woff2') format('woff2-variations');
  }
  html, body { margin: 0; padding: 0; overflow: hidden; background: var(--void); }
  /* Las ilustraciones son WebP sin alfa sobre negro: el negro se vuelve
     transparente al mezclar. La máscara de borde evita el rectángulo que dibuja
     el resto que el codec decodifica como 1-9 en vez de 0. */
  .blend {
    mix-blend-mode: screen;
    -webkit-mask-image:
      linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%),
      linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%);
    mask-image:
      linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%),
      linear-gradient(to bottom, transparent 0, #000 6%, #000 94%, transparent 100%);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }
`

/** La tarjeta al compartir: la misma escena de la página, apaisada. */
const og = `<!doctype html><html><head><meta charset="utf-8"><style>${PALETA}
  body { width: 1200px; height: 630px; position: relative; font-family: var(--body); color: var(--paper); }
  .glow {
    position: absolute; inset: 0;
    background: radial-gradient(520px 440px at 30% 52%,
      rgba(255, 79, 163, 0.4) 0%, rgba(59, 123, 255, 0.24) 42%, rgba(20, 9, 28, 0) 74%);
  }
  .escena { position: absolute; left: 18px; top: 40px; width: 540px; height: 540px; }
  .valija { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.78; }
  .kilo { position: absolute; left: 15%; bottom: 0; width: 70%; }
  /* El nivel del líquido, en la proporción real de la valija: una lámina fina
     en el fondo de la cavidad. Las medidas salen del archivo (246,338 a
     782,756 sobre 1024) escaladas a 540. */
  .relleno {
    position: absolute; left: 130px; top: 383px; width: 283px; height: 14px;
    border-radius: 0 0 14px 14px; filter: blur(3px); opacity: 0.85;
    background: linear-gradient(90deg, var(--bubblegum), var(--electric) 36%, var(--mint) 70%, var(--sherbet));
  }
  .texto { position: absolute; left: 596px; top: 196px; width: 560px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 76px; line-height: 1;
    margin: 0 0 22px; letter-spacing: -0.01em;
  }
  p { margin: 0; font-size: 27px; line-height: 1.35; font-weight: 500; max-width: 24ch; text-wrap: balance; }
  .dominio {
    position: absolute; left: 598px; top: 470px;
    font-family: var(--display); font-size: 25px; color: var(--mint); letter-spacing: 0.02em;
  }
</style></head><body>
  <div class="glow"></div>
  <div class="escena">
    <div class="relleno"></div>
    <img class="valija blend" src="/suitcase/hero_suitcase.webp" alt="">
    <img class="kilo blend" src="/hero/kilo.webp" alt="">
  </div>
  <div class="texto">
    <h1>Buy me a kilo</h1>
    <p>One suitcase, 23 kilos, bound for Korea and Japan.</p>
  </div>
  <div class="dominio">buymeakilo.com</div>
</body></html>`

/** El ícono: Kilo solo, centrado, sobre el violeta del fondo. */
const icono = (lado) => `<!doctype html><html><head><meta charset="utf-8"><style>${PALETA}
  body { width: ${lado}px; height: ${lado}px; position: relative; }
  /* Sin blend acá: el ícono se ve sobre el chrome del navegador, no sobre la
     página, así que el fondo lo pone esta caja y tiene que ser opaco. */
  img { position: absolute; left: -6%; top: -4%; width: 112%; }
</style></head><body><img src="/hero/kilo.webp" alt=""></body></html>`

const salidas = [
  { html: og, ancho: 1200, alto: 630, archivo: 'public/og.png' },
  { html: icono(180), ancho: 180, alto: 180, archivo: 'public/apple-touch-icon.png' },
  { html: icono(32), ancho: 32, alto: 32, archivo: 'public/favicon.png' },
]

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
try {
  for (const s of salidas) {
    writeFileSync(SCRATCH, s.html)
    const page = await browser.newPage({ viewport: { width: s.ancho, height: s.alto } })
    await page.goto(`${BASE}/__render.html`, { waitUntil: 'networkidle' })
    // Sin esperar a que las caras estén cargadas de verdad, la captura sale con
    // la tipografía de respaldo: fonts.ready sola no alcanza si nadie las pidió.
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('400 76px "Bagel Fat One"'),
        document.fonts.load('500 27px "Familjen Grotesk"'),
      ])
      await document.fonts.ready
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: s.archivo })
    await page.close()
    console.log(`${s.archivo} (${s.ancho}x${s.alto})`)
  }
} finally {
  await browser.close()
  rmSync(SCRATCH, { force: true })
}
