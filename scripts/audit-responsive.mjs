#!/usr/bin/env node
/**
 * Auditoría responsive. Recorre una grilla de anchos y chequea, en cada uno:
 *
 *   - que no haya scroll horizontal accidental
 *   - que los cuatro tiers entren antes del fold cuando la altura alcanza
 *   - que ningún texto se desborde de su caja
 *   - que la cinta del carrusel mantenga la misma velocidad lineal
 *
 * Playwright NO es dependencia del proyecto a propósito: instalarlo agrega
 * ~150 MB de navegadores a cada deploy de Vercel para algo que se corre a mano.
 * Antes de usarlo, una vez:
 *
 *   npm i --no-save playwright
 *   npm run dev          (en otra terminal)
 *   node scripts/audit-responsive.mjs
 */
const BASE = process.env.AUDIT_URL ?? 'http://localhost:5173'

/** Las dos páginas. /open se había quedado afuera y ahí apareció un scroll. */
const PAGES = [
  { label: 'landing', path: '/', wait: 1200 },
  { label: 'a mitad', path: '/?g=11500', wait: 1200 },
  { label: '/open', path: '/open?sticker=sticker_11', wait: 4200 },
]

const VIEWPORTS = [
  // 360x640 es el contrato: ahí los cuatro tiers tienen que entrar antes del
  // fold. En 320x568 y en horizontal el hero no entra y es una decisión, no un
  // bug: comprimirlo más para un teléfono de 2016 rompería el resto.
  { name: 'iPhone SE viejo', w: 320, h: 568, foldOptional: true },
  { name: 'referencia', w: 360, h: 640 },
  { name: 'Android típico', w: 390, h: 844 },
  { name: 'iPhone Plus', w: 414, h: 896 },
  { name: 'horizontal', w: 740, h: 360, foldOptional: true },
  { name: 'tablet', w: 768, h: 1024 },
  { name: 'tablet ancha', w: 1024, h: 768 },
  { name: 'laptop', w: 1280, h: 800 },
  { name: 'desktop', w: 1440, h: 900 },
  { name: 'desktop ancho', w: 1920, h: 1080 },
]

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('\nFalta Playwright. Instalalo sin guardarlo:\n\n  npm i --no-save playwright\n')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
})

const rows = []
let failures = 0

for (const pg of PAGES) for (const vp of VIEWPORTS) {
  const page = await (await browser.newContext({ viewport: { width: vp.w, height: vp.h } })).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(BASE + pg.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(pg.wait)

  const r = await page.evaluate(() => {
    const doc = document.documentElement
    // Con los tiers afuera, el último elemento del fold es el botón.
    const last = document.querySelector('.support')
    const lastBottom = last ? Math.round(last.getBoundingClientRect().bottom) : null

    // Texto que se sale de su caja.
    const overflowing = []
    for (const el of document.querySelectorAll('p, span, h1, h2, div, a')) {
      if (!el.textContent?.trim() || el.children.length > 0) continue
      // .sr-only está recortado a propósito para lectores de pantalla.
      if (el.closest('.sr-only')) continue
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        overflowing.push(`${el.className || el.tagName}: "${el.textContent.trim().slice(0, 28)}"`)
      }
    }

    const track = document.querySelector('.marquee__track')
    const row = document.querySelector('.marquee__row')
    const speed =
      track && row
        ? row.getBoundingClientRect().width / parseFloat(getComputedStyle(track).animationDuration)
        : null

    return {
      scrollH: doc.scrollWidth > window.innerWidth,
      lastBottom,
      overflowing,
      speed,
    }
  })

  const foldOk = r.lastBottom !== null && r.lastBottom <= vp.h
  const problems = []
  if (r.scrollH) problems.push('scroll horizontal')
  if (r.overflowing.length) problems.push(`texto desbordado (${r.overflowing.length})`)
  if (errors.length) problems.push(`errores de consola (${errors.length})`)
  if (r.lastBottom !== null && !foldOk && !vp.foldOptional) {
    problems.push(`botón cortado (${r.lastBottom} > ${vp.h})`)
  }

  if (problems.length) failures++
  rows.push({
    vp: `${vp.w}x${vp.h}`,
    name: `${pg.label} · ${vp.name}`,
    fold:
      r.lastBottom === null
        ? '—'
        : `${r.lastBottom}/${vp.h}${foldOk ? '' : vp.foldOptional ? ' (acepta)' : ' ⚠'}`,
    speed: r.speed ? `${r.speed.toFixed(1)} px/s` : '—',
    estado: problems.length ? problems.join(', ') : 'ok',
  })
  for (const o of r.overflowing) rows.push({ vp: '', name: '', fold: '', speed: '', estado: `    ↳ ${o}` })
  for (const e of errors) rows.push({ vp: '', name: '', fold: '', speed: '', estado: `    ↳ ${e.slice(0, 70)}` })
}

await browser.close()

const pad = (v, n) => String(v).padEnd(n)
console.log(`\n${pad('viewport', 11)}${pad('', 26)}${pad('botón/fold', 13)}${pad('carrusel', 12)}estado`)
console.log('-'.repeat(88))
for (const r of rows) {
  console.log(`${pad(r.vp, 11)}${pad(r.name, 26)}${pad(r.fold, 13)}${pad(r.speed, 12)}${r.estado}`)
}
console.log(
  failures === 0
    ? `\n${VIEWPORTS.length * PAGES.length} combinaciones, ninguna con problemas.\n`
    : `\n${failures} de ${VIEWPORTS.length * PAGES.length} combinaciones con algo que mirar.\n`,
)
process.exit(failures === 0 ? 0 : 1)
