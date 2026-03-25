import { useEffect, useRef, useState } from 'react'

export function ScrollFadeIn({ className = '', children }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setIsVisible(true)
      },
      { threshold: 0.15 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className={`fade-in ${isVisible ? 'fade-in--visible' : ''} ${className}`}>
      {children}
    </section>
  )
}

