import { copy } from '../copy'

export function Footer() {
  return (
    <footer className="footer">
      {copy.footer.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </footer>
  )
}
