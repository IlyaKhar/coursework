import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ScrollFadeIn } from '../features/scroll/ScrollFadeIn'

const TodoApp = lazy(() => import('../features/todos/TodoApp'))
const CalendarPanel = lazy(() => import('../features/calendar/CalendarPanel'))

export function AppContent({ embedded = false }) {
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsBooting(false), 450)
    return () => clearTimeout(t)
  }, [])

  const boot = useMemo(
    () => (
      <div className={`app-shell app-shell--loading ${embedded ? 'is-embedded' : ''}`} aria-busy="true">
        <div className="app-card">
          <div className="sk sk-title" />
          <div className="sk sk-line" />
          <div className="sk sk-line" />
          <div className="sk sk-line" />
        </div>
      </div>
    ),
    [embedded],
  )

  return (
    <div className={`app-shell ${embedded ? 'is-embedded' : ''}`}>
      <header className="app-header">
        <div className="app-header__brand">
          <div>
            <div className="app-header__title">Умный сайт-органайзер</div>
            <div className="app-header__subtitle">Задачи, приоритеты, фильтры, хоткеи, localStorage</div>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        <div className="app-grid">
          <ScrollFadeIn className="app-panel">
            <Suspense fallback={boot}>
              {isBooting ? boot : <TodoApp />}
            </Suspense>
          </ScrollFadeIn>

          <ScrollFadeIn className="app-panel app-panel--three">
            <Suspense fallback={<div className="app-three__fallback">Календарь загружается…</div>}>
              <CalendarPanel />
            </Suspense>
          </ScrollFadeIn>
        </div>
      </main>
    </div>
  )
}

