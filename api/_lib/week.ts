/**
 * Clave de semana ISO en UTC. La semana arranca el lunes 00:00 UTC,
 * que es exactamente cuando se resetea la barra de la meta.
 */
export function isoWeekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // jueves de la semana en curso define el año ISO
  const day = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - day + 3)
  const isoYear = t.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstDay = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3)
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${isoYear}_${String(week).padStart(2, '0')}`
}

/** Las N semanas ISO anteriores a la actual, de la más reciente a la más vieja. */
export function previousWeekKeys(n: number, from: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = 1; i <= n; i++) {
    out.push(isoWeekKey(new Date(from.getTime() - i * 7 * 86400000)))
  }
  return out
}
