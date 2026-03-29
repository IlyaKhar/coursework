import { CustomCursor } from './features/cursor/CustomCursor'
import { MouseGlow } from './features/mouse/MouseGlow'
import { PhoneScene } from './features/phone/PhoneScene'
import { BackgroundVideo } from './features/video/BackgroundVideo'
import { AppContent } from './app/AppContent'

export function App() {
  return (
    <div className="app-root">
      <BackgroundVideo />
      <MouseGlow />
      <CustomCursor />

      <PhoneScene>
        <AppContent embedded />
      </PhoneScene>
    </div>
  )
}
