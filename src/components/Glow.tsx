/**
 * El único gradiente de la página: un resplandor radial detrás de la valija que
 * se atenúa hacia abajo. Nada de viñetas en las esquinas ni gradientes en el
 * resto de la página.
 *
 * Vive acá, detrás de todo el contenido, y no dentro de la valija: adentro
 * quedaba encerrado en la caja de la ilustración y se leía como una viñeta.
 */
export function Glow({ intensity }: { intensity: number }) {
  return <div className="glow" style={{ ['--glow' as string]: intensity.toFixed(2) }} aria-hidden="true" />
}
