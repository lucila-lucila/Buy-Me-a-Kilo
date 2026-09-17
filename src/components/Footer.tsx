import { copy } from '../copy'

/** El pie, en un renglón. El link es la salida de emergencia al sticker. */
export function Footer() {
  return (
    <footer className="footer">
      {copy.footer.line}
      <span aria-hidden="true"> · </span>
      {/* Si alguien cerró la pestaña de Ko-fi antes de tocar el enlace del
          mensaje de gracias, este es el único otro camino que le queda. */}
      <a className="footer__open" href="/open">
        {copy.footer.openLink}
      </a>
    </footer>
  )
}
