import { copy } from '../copy'

/**
 * El dominio que va al pie de la tarjeta para compartir.
 *
 * Sale del host desde el que se abrió la página, no de una constante: la tarjeta
 * es lo único de la página que viaja sola, y un dominio equivocado ahí la vuelve
 * inútil. Así funciona igual en un preview de Vercel, en el dominio final, y el
 * día que cambie no hay que acordarse de tocar nada.
 */
export function siteDomain(): string {
  if (typeof window === 'undefined') return copy.domain
  const host = window.location.hostname.replace(/^www\./, '')
  const isLocal = !host || host === 'localhost' || host.endsWith('.local') || /^[\d.]+$/.test(host)
  return isLocal ? copy.domain : host
}
