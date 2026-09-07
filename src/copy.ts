import { gramsForDollars } from './config/suitcase'
import { HOURS_TIER_MS, MINUTES_TIER_MS } from './config/countdown'
import type { Countdown } from './lib/useCountdown'

/** "1 hour" / "6 hours". Sin abreviar: la página no escribe "6h". */
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
]

/**
 * Números en palabras hasta veinte; de ahí en más, en dígitos. Pasada esa
 * altura el dígito pelado dice mejor lo desmedido del asunto: "then there were
 * 41" se lee como lo que es.
 */
function asWord(n: number): string {
  return WORDS[n] ?? String(n)
}

/**
 * Todo el texto de la página. Seco, sin signos de exclamación, sin emojis, sin
 * agradecer. La narradora no se presenta y no explica por qué viaja.
 */
export const copy = {
  hero: {
    title: 'Buy me a kilo',
    /**
     * La línea operativa va arriba del fold, sola: es la que explica qué se
     * compra. El resto del relato entra apenas abajo, después del botón.
     */
    lead: "Fill a kilo, get a sticker. You don't get to pick which one.",
    /**
     * El relato, apenas abajo del botón. No repite nada de lo que ya dijeron
     * la valija, el número o la línea rotativa: el destino y el plazo viven
     * arriba.
     */
    /**
     * `{when}` lo completa el servidor. Hoy dice "five weeks", que es la frase
     * escrita, pero cuando falten doce días va a decir doce días en vez de
     * contradecir a la cuenta regresiva que está tres renglones más arriba.
     */
    prose: [
      "There is one suitcase. It's mine. It leaves for Japan in {when}.",
      'Then there will be another suitcase, and another country.',
      'That part is not your problem yet.',
    ],
    /**
     * La explicación del modelo, dicha con orgullo. Es lo que hace que nadie
     * sienta que lo estafaron cuando compra "un kilo" y ve subir tres gramos.
     * No sacar.
     */
    joke: 'a kilo costs about two hundred people. that is the whole joke.',
  },

  suitcase: {
    /** El número grande: los kilos que hay adentro, con un decimal. */
    ofCapacity: (capacity: number) => `of ${capacity} kilos`,
    /** El renglón que se mueve con cada aporte individual. */
    detail: (grams: number, people: number, percent: number) =>
      `${grams.toLocaleString('en-US')} grams packed · ${people.toLocaleString('en-US')} people · ${percent.toFixed(1)}% full`,
    overweight: 'The suitcase is now illegal. Continue anyway.',
  },

  people: {
    count: (n: number) => `${n.toLocaleString('en-US')} people so far`,
    /**
     * Declara el origen del arrastre en voz alta. Un número explicado es más
     * fuerte que uno que aparece solo, y la página se sostiene sobre decir la
     * verdad sobre sí misma. No sacar.
     */
    note: 'most of them before this page existed. they came from somewhere else.',
  },

  /**
   * Un solo renglón que va alternando. Todo lo que antes eran cuatro bloques
   * sueltos de texto entra acá de a uno: el hero deja de ser un muro.
   *
   * La cuenta regresiva NO está acá: tiene su lugar fijo. Escondida seis
   * segundos de cada veinticuatro no crea ninguna urgencia.
   */
  rotating: {
    origin: 'most of them arrived before this page existed',
    next: 'next stop japan. after that, undecided.',
  },

  countdown: {
    /**
     * En primera persona. No es "el avión": es su vuelo, y el plazo es de ella
     * antes que de la página. La parte fija va separada del número para poder
     * darle a la cifra más peso visual que al resto de la frase.
     */
    lead: 'my flight to japan leaves in',

    /**
     * La cifra, por tramos. Nunca hay segundos: son el recurso de las páginas
     * de ofertas falsas y esa asociación no la queremos. Las horas tampoco
     * aparecen todo el tiempo, solo cuando ya dicen algo.
     *
     *   más de dos días   45 days and 6 hours
     *   menos de dos días 34 hours
     *   menos de tres     47 minutes
     */
    value: (c: Countdown): string => {
      if (c.totalMs < MINUTES_TIER_MS) {
        // Debajo del minuto no queda unidad más chica que decir sin caer en los
        // segundos, así que se dice en palabras.
        return c.minutes < 1 ? 'less than a minute' : plural(c.minutes, 'minute')
      }
      if (c.totalMs < HOURS_TIER_MS) return plural(c.totalHours, 'hour')
      return c.hours > 0
        ? `${plural(c.days, 'day')} and ${plural(c.hours, 'hour')}`
        : plural(c.days, 'day')
    },

    /** En cero. Punto final: es la única frase de la página que lo lleva. */
    gone: 'the flight left.',

    /** El mismo dato dentro de la prosa de abajo, en palabras y sin precisión. */
    inline: (days: number) =>
      days <= 0
        ? 'a while ago'
        : days === 1
          ? 'a day'
          : days < 14
            ? `${asWord(days)} days`
            : `${asWord(Math.round(days / 7))} weeks`,
  },

  support: {
    cta: 'add to the suitcase',
    /**
     * El precio ahora se dice. Los gramos salen de GRAMS_PER_DOLLAR, no están
     * escritos a mano: si cambia la constante, la frase se corrige sola.
     */
    note: `five dollars is ${asWord(gramsForDollars(5))} grams. put in whatever you want.`,
  },

  grid: {
    heading: 'Twelve of these exist. You get one.',
  },

  privacy: {
    lines: [
      "I don't know who you are. I don't want to know.",
      'Your stickers live in your browser and nowhere else.',
    ],
  },

  footer: {
    lines: ['No account. No email. No newsletter.', 'You will never hear from me again.'],
    /** Una línea más chica y más tibia, en el mismo registro seco. */
    signature: 'made by hand, in the dark, at an hour that was not reasonable.',
  },

  open: {
    filling: 'The suitcase takes it.',
    shaking: 'Something is in the bag.',
    duplicate: 'duplicate. the suitcase sighs.',
    rarity: {
      common: 'common. it counts the same.',
      rare: 'rare. nothing happens differently.',
      cursed: 'cursed. it came out wrong and it stays that way.',
    } as const,
    download: 'Download the sticker',
    share: 'Make a shareable image',
    sharing: 'Composing',
    shared: 'Saved',
    back: 'Back to the suitcase',
    collection: (n: number) => (n === 1 ? 'you have 1 of twelve' : `you have ${n} of twelve`),
    noPurchase: 'You can be here without having paid. I am not going to stop you.',
  },

  /** Una línea por rareza en la tarjeta para compartir. */
  shareCard: {
    common: 'i bought a kilo.',
    rare: 'i got a rare one.',
    cursed: 'i got the sad one.',
  } as const,

  domain: 'buymeakilo.com',
} as const
