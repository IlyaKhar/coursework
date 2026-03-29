import { useEffect, useRef } from 'react'
import bgVideoSrc from './28-HD.mp4'

export function BackgroundVideo() {
  const ref = useRef(null)

  useEffect(() => {
    function onVisibility() {
      const el = ref.current
      if (!el) return
      if (document.visibilityState === 'hidden') el.pause()
      else el.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <div className="bg-video" aria-hidden="true">
      <video ref={ref} className="bg-video__media" autoPlay muted loop playsInline>
        <source src={bgVideoSrc} type="video/mp4" />
      </video>
      <div className="bg-video__veil" />
    </div>
  )
}
