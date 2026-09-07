#!/usr/bin/env node
/**
 * Compone la imagen de compartir: public/share/og.png, de 1200x630.
 *
 * Se dibuja en el navegador y no con una librería de imágenes, para que use las
 * mismas tipografías, la misma paleta y la misma ilustración que la página. Una
 * tarjeta hecha aparte se despega del sitio en la primera semana.
 *
 * Playwright no es dependencia del proyecto a propósito: son ~150 MB de
 * navegadores en cada deploy para algo que se corre a mano cuando cambia el
 * arte. Antes de usarlo, una vez:
 *
 *   npm i --no-save playwright
 *   npm run dev            (en otra terminal)
 *   node scripts/make-share-image.mjs
 */
import { writeFileSync, rmSync } from 'node:fs'

const BASE = process.env.AUDIT_URL ?? 'http://localhost:5173'
const OUT = 'public/share/og.png'

/**
 * La página se escribe en public/ y se abre por el servidor de desarrollo en vez
 * de inyectarse con setContent: así tiene un origen de verdad y las @font-face
 * cargan. Con setContent el documento es about:blank y las tipografías fallan en
 * silencio; la tarjeta salía con la de respaldo. Se borra al terminar.
 */
const SCRATCH = 'public/__share-card.html'

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('\nFalta Playwright. Instalalo sin guardarlo:\n\n  npm i --no-save playwright\n')
  process.exit(1)
}

/* Tres, lejos del texto: el bloque de tipografía ocupa de 470 a 1170 en x y de
   150 a 400 en y, así que van arriba a la derecha y abajo a la derecha. */
const STICKERS = [
  { file: 'sticker_03', x: 1004, y: 22, size: 150, rot: -9 },
  { file: 'sticker_07', x: 992, y: 424, size: 176, rot: 7 },
  { file: 'sticker_11', x: 790, y: 452, size: 132, rot: 12 },
]

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
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
  /* Las @font-face van escritas acá y no importadas de src/: en desarrollo Vite
     sirve los .css como módulos de JavaScript, así que un <link> a fonts.css
     entra pero no aplica, y la tarjeta salía con la tipografía de respaldo. */
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
  html, body { margin: 0; padding: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: var(--void);
    position: relative;
    font-family: var(--body);
    color: var(--paper);
  }
  /* El mismo resplandor de la página, corrido a la izquierda para que quede
     detrás de la valija. */
  .glow {
    position: absolute; inset: 0;
    background: radial-gradient(560px 460px at 28% 46%,
      rgba(255, 79, 163, 0.42) 0%, rgba(59, 123, 255, 0.26) 42%, rgba(20, 9, 28, 0) 74%);
  }
  .suitcase { position: absolute; left: -34px; top: 40px; width: 560px; height: 560px; }
  /* El nivel del líquido, en la misma proporción que tiene la valija de verdad:
     una lámina fina en el fondo de la cavidad. Las medidas salen de las de la
     ilustración (246,338 a 782,756 sobre 1024) escaladas a 560. */
  .fill {
    position: absolute; left: 101px; top: 439px; width: 293px; height: 15px;
    border-radius: 0 0 14px 14px;
    background: linear-gradient(90deg, var(--bubblegum), var(--electric) 36%, var(--mint) 70%, var(--sherbet));
    filter: blur(3px); opacity: 0.85;
  }
  .sticker { position: absolute; }
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
  .text { position: absolute; left: 470px; top: 178px; width: 700px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 74px; line-height: 1;
    margin: 0 0 22px; letter-spacing: -0.01em;
    text-shadow: 0 0 34px rgba(255, 79, 163, 0.5);
  }
  p {
    margin: 0; font-size: 27px; line-height: 1.35; font-weight: 500;
    max-width: 26ch; text-wrap: balance;
  }
  .domain {
    position: absolute; left: 472px; top: 486px;
    font-family: var(--display); font-size: 25px; color: var(--mint);
    letter-spacing: 0.02em;
  }
</style></head>
<body>
  <div class="glow"></div>
  <div class="fill"></div>
  <img class="suitcase blend" src="/suitcase/hero_suitcase.webp" alt="">
  ${STICKERS.map(
    (s) =>
      `<img class="sticker blend" src="/stickers/webp/${s.file}.webp" alt=""
         style="left:${s.x}px;top:${s.y}px;width:${s.size}px;height:${s.size}px;transform:rotate(${s.rot}deg)">`,
  ).join('\n  ')}
  <div class="text">
    <h1>Buy me a kilo</h1>
    <p>One suitcase. Fill a kilo, get a sticker.</p>
  </div>
  <div class="domain">buymeakilo.com</div>
</body></html>`

writeFileSync(SCRATCH, html)

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
try {
  await page.goto(`${BASE}/__share-card.html`, { waitUntil: 'networkidle' })
  // Sin esperar a que las dos caras estén cargadas de verdad, la captura sale con
  // la tipografía de respaldo: fonts.ready sola no alcanza si nadie las pidió.
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 74px "Bagel Fat One"'),
      document.fonts.load('500 27px "Familjen Grotesk"'),
    ])
    await document.fonts.ready
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: OUT })
} finally {
  await browser.close()
  rmSync(SCRATCH, { force: true })
}

console.log(`imagen de compartir escrita en ${OUT} (1200x630)`)
