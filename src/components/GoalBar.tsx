import { copy } from '../copy'
import { WEEKLY_GOAL_KG } from '../config/goals'

/**
 * La barra de la meta semanal. Siempre visible, incluso con la valija vacía:
 * es lo que reemplaza al número grande mientras el total no dice nada todavía.
 * La meta se recalibra entre semanas; el progreso son kilos reales, siempre.
 */
export function GoalBar({ week, overweight }: { week: number; overweight: boolean }) {
  const pct = Math.min(100, (week / WEEKLY_GOAL_KG) * 100)

  return (
    <div className={`goal${overweight ? ' goal--over' : ''}`}>
      <div
        className="goal__track"
        role="progressbar"
        aria-valuenow={week}
        aria-valuemin={0}
        aria-valuemax={WEEKLY_GOAL_KG}
        aria-label={`${week} kilos ${copy.counter.weekLabel}, ${copy.counter.goalSuffix(WEEKLY_GOAL_KG)}`}
      >
        <div className="goal__fill" style={{ width: `${Math.max(pct, week > 0 ? 3 : 0)}%` }} />
      </div>
      <div className="goal__meta">
        <span>{copy.counter.weekLabel}</span>
        <span>
          {week} {copy.counter.goalSuffix(WEEKLY_GOAL_KG)}
        </span>
      </div>
      {overweight && <p className="goal__over">{copy.counter.overweight}</p>}
    </div>
  )
}
