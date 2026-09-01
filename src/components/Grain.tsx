/**
 * Grano. Una capa de feTurbulence en overlay, opacidad baja, animada muy lento.
 * No tiene que taparle nada al texto.
 */
export function Grain() {
  return (
    <svg className="grain" aria-hidden="true" focusable="false">
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch">
          <animate
            attributeName="baseFrequency"
            dur="40s"
            values="0.75;0.85;0.75"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  )
}
