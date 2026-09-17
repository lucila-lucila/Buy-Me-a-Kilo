import { gramsForDollars } from './config/suitcase'

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
     * La carta de presentación, debajo del título y arriba de la valija.
     *
     * Es lo que explica para qué existen los stickers —dejar una marca donde
     * pase— y lo que convierte al viaje en algo que sigue en vez de terminar.
     * Reemplaza al cierre que estaba al final ("there is one suitcase, it's
     * mine, después habrá otra"), que decía lo mismo peor y desde abajo.
     */
    mission: 'my mission is to travel the world and leave my mark wherever I go.',

    /** El destino, en su propio renglón. Los dos países y en ese orden. */
    next: 'next stop: south korea and japan.',
  },

  game: {
    /**
     * Cómo se juega, en un renglón, debajo del canvas. Es también el nombre
     * accesible del canvas, así que tiene que decir la acción y no el adorno.
     */
    help: 'tap to fly. collect what fits. avoid the fees.',

    /**
     * Antes del primer toque. Con movimiento reducido es lo único que se ve:
     * el juego arranca quieto y no se mueve hasta que la persona lo toca.
     * Alguien que pidió que nada se mueva no puede entrar a una pantalla con
     * un juego corriendo solo.
     */
    tapToPlay: 'tap to play',

    /** Los gramos de la partida en curso, arriba a la izquierda del canvas. */
    packed: (g: number) => `${g.toLocaleString('en-US')} grams`,

    /**
     * El resultado. Dice la verdad de una manera que empuja a donar sin mentir:
     * el número es real, y lo que no es real son los gramos.
     */
    result: {
      packed: (g: number) => `you packed ${g.toLocaleString('en-US')} grams.`,
      fake: 'none of them were real.',
      best: (g: number) => `your best: ${g.toLocaleString('en-US')} grams`,
      again: 'play again',
      /** Debajo del botón de donar, recién cuando hay un resultado. */
      note: 'five dollars is three grams. those ones count.',
    },
  },

  suitcase: {
    /**
     * Todo el estado de la valija en un renglón, al lado del medidor chico.
     *
     * Kilo se fue a ser el personaje del juego, así que la valija dejó de tener
     * a quién acompañar y dejó de ser una ilustración: es un dato. Los tres
     * números salen de la API y ninguno está escrito a mano.
     */
    line: (kilos: number, capacity: number, grams: number, people: number) =>
      `${kilos.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} of ${capacity} kilos · ${grams.toLocaleString('en-US')} grams · ${people.toLocaleString('en-US')} people`,
    overweight: 'The suitcase is now illegal. Continue anyway.',
  },

  countdown: {
    /** El rótulo de arriba. Chico: lo que se lee son los números. */
    heading: 'until the plane leaves for korea and japan',

    /**
     * Las etiquetas de las tres cajitas. En plural siempre: son rótulos de
     * columna, no una frase, y "1 hours" no se lee como error acá.
     */
    labels: { days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds' } as const,

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

  /** Textos alternativos. Descriptivos y en el tono de la página, nunca vacíos. */
  alt: {
    kilo: 'Kilo, a small glowing blob with a face',
    suitcase: 'A suitcase filling up with light as people put grams in it',
  },

  privacy: {
    lines: [
      "I don't know who you are. I don't want to know.",
      'Your stickers live in your browser and nowhere else.',
    ],
  },

  footer: {
    lines: ['No account. No email. No newsletter.'],
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
