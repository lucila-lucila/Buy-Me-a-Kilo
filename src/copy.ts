import { gramsForDollars } from './config/suitcase'
import { MAX_UNITS, MAX_UNITS_REDUCED } from './config/countdown'
import type { Countdown } from './lib/useCountdown'

/**
 * Una unidad de la cuenta regresiva. Sale numerada y con la palabra aparte
 * porque el número se dibuja en una casilla de ancho fijo: si "3 seconds" y
 * "13 seconds" no ocupan lo mismo, la frase entera se corre cada diez segundos.
 */
export interface CountdownUnit {
  n: number
  /** Ya en plural o en singular, según corresponda. */
  label: string
}

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
    /**
     * El espacio entre "You" y "don't" es duro (\u00a0) a propósito: sin él, en
     * un teléfono angosto el renglón se cortaba justo después de "You" y la
     * frase quedaba partida por la mitad de la cláusula. Atado así, el único
     * corte posible cae después del punto, que es donde tiene que caer.
     */
    lead: "Fill a kilo, get a sticker. You\u00a0don't get to pick which one.",
    /**
     * El cierre, al final de todo. Dos líneas y nada más.
     *
     * Ya no dice cuándo sale: eso lo dice la cuenta regresiva, con los segundos
     * puestos, y una prosa que dijera "in six weeks" la estaría contradiciendo
     * en la misma pantalla. Tampoco está más "that part is not your problem
     * yet", que no agregaba nada.
     */
    prose: [
      "There is one suitcase. It's mine.",
      'Then there will be another one, and another country.',
    ],
    /**
     * La explicación del modelo, dicha con orgullo. Es lo que hace que nadie
     * sienta que lo estafaron cuando compra "un kilo" y ve subir tres gramos.
     * No sacar.
     *
     * Va debajo del botón, con la nota del precio: entre el mensaje central y
     * el botón cortaba el camino al clic.
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

  countdown: {
    /**
     * En primera persona. No es "el avión": es su vuelo, y el plazo es de ella
     * antes que de la página. La parte fija va separada del número para poder
     * darle a la cifra más peso visual que al resto de la frase.
     */
    lead: 'my flight to japan leaves in',

    /**
     * Las unidades, de la más grande a la más chica, sin las que están en cero
     * arriba de todo: cuando no quedan días la frase empieza en horas sola.
     *
     *   normal            44 days, 8 hours, 12 minutes and 3 seconds
     *   sin días          8 hours, 12 minutes and 3 seconds
     *   última hora       12 minutes and 3 seconds
     *   movimiento red.   44 days and 8 hours
     *
     * Con movimiento reducido no hay segundero y se corta en dos unidades, que
     * es lo que se puede decir sin que nada se mueva solo en pantalla.
     */
    units: (c: Countdown, reduced = false): CountdownUnit[] => {
      const max = reduced ? MAX_UNITS_REDUCED : MAX_UNITS
      const all = [
        { n: c.days, word: 'day' },
        { n: c.hours, word: 'hour' },
        { n: c.minutes, word: 'minute' },
        // Con movimiento reducido los segundos ni se calculan en la frase.
        ...(reduced ? [] : [{ n: c.seconds, word: 'second' }]),
      ]

      const first = all.findIndex((u) => u.n > 0)
      if (first === -1) return []

      return all
        .slice(first, first + max)
        .map((u) => ({ n: u.n, label: u.n === 1 ? u.word : `${u.word}s` }))
    },

    /**
     * Abajo del minuto y con movimiento reducido no queda unidad que decir sin
     * poner un segundero, así que se dice en palabras.
     */
    almost: 'less than a minute',

    /** En cero. Punto final: es la única frase de la página que lo lleva. */
    gone: 'the flight left.',
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
    /**
     * La red de seguridad de todo el circuito. El único camino al sticker es el
     * mensaje de gracias de Ko-fi, y quien cierre esa pestaña lo pierde para
     * siempre. Chiquito y al pie: no es una invitación, es una salida de
     * emergencia. Que además entre alguien que no pagó ya estaba asumido, y la
     * propia /open lo dice en voz alta.
     */
    openLink: 'already paid? open your sticker',
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
