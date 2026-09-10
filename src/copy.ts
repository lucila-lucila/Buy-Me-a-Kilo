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
    /**
     * La línea operativa va arriba del fold: es la que explica qué se compra.
     */
    /**
     * El espacio entre "You" y "don't" es duro (\u00a0) a propósito: sin él, en
     * un teléfono angosto el renglón se cortaba justo después de "You" y la
     * frase quedaba partida por la mitad de la cláusula. Atado así, el único
     * corte posible cae después del punto, que es donde tiene que caer.
     */
    lead: "Fill a kilo, get a sticker. You\u00a0don't get to pick which one.",
  },

  suitcase: {
    /** El número grande: los kilos que hay adentro, con un decimal. */
    ofCapacity: (capacity: number) => `of ${capacity} kilos`,
    /**
     * El renglón que se mueve con cada aporte individual.
     *
     * Sin el porcentaje: al lado de una barra que ya lo dibuja y de un número
     * que ya dice los kilos, era el mismo dato por tercera vez. percentFull
     * sigue viniendo de la API y sigue moviendo la barra y el nivel de la
     * valija; lo único que se fue es imprimirlo.
     */
    detail: (grams: number, people: number) =>
      `${grams.toLocaleString('en-US')} grams packed · ${people.toLocaleString('en-US')} people`,
    overweight: 'The suitcase is now illegal. Continue anyway.',
  },

  countdown: {
    /** El rótulo de arriba. Chico: lo que se lee son los números. */
    heading: 'until the plane leaves for japan',

    /**
     * Las etiquetas de las cuatro cajitas. En plural siempre: son rótulos de
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
