import { useEffect, useRef, useState } from 'react'

const FALLBACK_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export function BackgroundVideo() {
  const ref = useRef(null)
  const [isEnabled, setIsEnabled] = useState(true)

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

  if (!isEnabled) return null

  return (
    <div className="bg-video" aria-hidden="true">
      <video
        ref={ref}
        className="bg-video__media"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setIsEnabled(false)}>
        <source src={FALLBACK_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="bg-video__veil" />
    </div>
  )
}

