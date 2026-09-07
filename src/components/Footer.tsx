import { copy } from '../copy'

export function Footer() {
  return (
    <footer className="footer">
      {copy.footer.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {/* La salida de emergencia: si alguien cerró la pestaña de Ko-fi antes de
          tocar el enlace del mensaje de gracias, este es el único otro camino
          que le queda al sticker. */}
      <a className="footer__open" href="/open">
        {copy.footer.openLink}
      </a>
      <div className="footer__signature">{copy.footer.signature}</div>
    </footer>
  )
}
