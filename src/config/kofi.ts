/**
 * Ko-fi.
 *
 * Los cuatro items de tienda se eliminaron: un botón que ya funciona vale más
 * que una escalera perfecta que no existe. La persona elige el monto allá.
 *
 * El usuario va en el código y no en una env var: el link lo arma el navegador,
 * y una variable sin prefijo VITE_ no llega al cliente.
 */
export const KOFI_USERNAME = 'buymeakilo'

export const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`
