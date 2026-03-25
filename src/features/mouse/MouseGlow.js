import { useEffect, useMemo, useRef } from 'react'

export function MouseGlow() {
  const ref = useRef(null)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const el = ref.current
    if (!el) return

    let raf = 0
    let mx = 0
    let my = 0
    let x = 0
    let y = 0

    function onMove(e) {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }

    function tick() {
      raf = 0
      x += (mx - x) * 0.08
      y += (my - y) * 0.08
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
      if (Math.abs(mx - x) + Math.abs(my - y) > 0.1) raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [prefersReducedMotion])

  return <div className="mouse-glow" ref={ref} aria-hidden="true" />
}

