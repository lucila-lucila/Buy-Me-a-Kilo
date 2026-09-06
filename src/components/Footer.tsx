import { copy } from '../copy'

export function Footer() {
  return (
    <footer className="footer">
      {copy.footer.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      <div className="footer__signature">{copy.footer.signature}</div>
    </footer>
  )
}
