import { useEffect, useState } from 'react'
import { copy } from './copy'
import { COUNTER_THRESHOLD_KG, WEEKLY_GOAL_KG } from './config/goals'
import { useKilos } from './lib/useKilos'
import { readCollection, type Collection } from './lib/collection'
import { Suitcase } from './components/Suitcase'
import { KiloCounter } from './components/KiloCounter'
import { GoalBar } from './components/GoalBar'
import { TierGrid } from './components/TierGrid'
import { StickerGrid } from './components/StickerGrid'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'

export default function App() {
  const { data, stale } = useKilos()
  const [collection, setCollection] = useState<Collection>({})

  useEffect(() => {
    setCollection(readCollection())
  }, [])

  const week = data?.week ?? 0
  const total = data?.total ?? 0
  const overweight = week >= WEEKLY_GOAL_KG
  // Por debajo del umbral no se muestra el número: un "4 kg" dice que la página
  // está muerta. Lo que se muestra siempre es real, simplemente no se muestra
  // hasta que dice algo.
  const showTotal = total >= COUNTER_THRESHOLD_KG

  return (
    <>
      <Grain />
      <main className="page">
        <section className="hero">
          <h1 className="hero__title">{copy.hero.title}</h1>

          <Suitcase ratio={week / WEEKLY_GOAL_KG} overweight={overweight} />

          <div className="counter">
            {showTotal && <KiloCounter total={total} stale={stale} />}
            <GoalBar week={week} overweight={overweight} />
          </div>

          <p className="hero__lines">
            {copy.hero.lines.map((line, i) => (
              <span key={line}>
                {i === 2 ? <b>{line}</b> : line}
                {i < copy.hero.lines.length - 1 && <br />}
              </span>
            ))}
          </p>

          <TierGrid />
        </section>

        <StickerGrid collection={collection} />

        <p className="privacy">
          {copy.privacy.lines.map((line, i) => (
            <span key={line}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </p>

        <Footer />
      </main>
    </>
  )
}
