import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { BackgroundVideo } from './features/video/BackgroundVideo'
import { CustomCursor } from './features/cursor/CustomCursor'
import { MouseGlow } from './features/mouse/MouseGlow'
import { ScrollFadeIn } from './features/scroll/ScrollFadeIn'

const TodoApp = lazy(() => import('./features/todos/TodoApp'))
const ThreeScene = lazy(() => import('./features/three/ThreeScene'))

export function App() {
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsBooting(false), 450)
    return () => clearTimeout(t)
  }, [])

  const boot = useMemo(
    () => (
      <div className="app-shell app-shell--loading" aria-busy="true">
        <div className="app-card">
          <div className="sk sk-title" />
          <div className="sk sk-line" />
          <div className="sk sk-line" />
          <div className="sk sk-line" />
        </div>
      </div>
    ),
    [],
  )

  return (
    <div className="app-root">
      <BackgroundVideo />
      <MouseGlow />
      <CustomCursor />

      <div className="app-shell">
        <header className="app-header">
          <div className="app-header__brand">
            <div className="app-header__dot" aria-hidden="true" />
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
              <Suspense fallback={<div className="app-three__fallback">3D сцена загружается…</div>}>
                <ThreeScene />
              </Suspense>
            </ScrollFadeIn>
          </div>
        </main>
      </div>
    </div>
  )
}
