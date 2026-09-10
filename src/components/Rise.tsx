import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Aparece al entrar en pantalla: un fundido y un desplazamiento chico hacia
 * arriba, con un retraso escalonado por bloque.
 *
 * Con IntersectionObserver y una clase, no con una librería: es una transición
 * de CSS y no necesita nada más. Se desconecta al disparar, así que no vuelve a
 * animarse si la persona sube y baja.
 *
 * Con movimiento reducido no hay nada que hacer: el CSS deja la transición en
 * cero y el bloque nace visible.
 */
export function Rise({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el === null) return

    // Sin soporte, visible y listo: nunca se esconde contenido que no se pueda
    // volver a mostrar.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        obs.disconnect()
      },
      // Un poco antes de que llegue al borde, para que el bloque no aparezca
      // justo cuando ya lo estás mirando.
      { rootMargin: '0px 0px -10% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`rise${visible ? ' rise--in' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
