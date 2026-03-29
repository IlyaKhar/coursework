/** Локальное событие: тот же таб может подписаться (нативный storage — только другие вкладки) */
export const APP_STORAGE_EVENT = 'smart-organizer:storage'

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    try {
      window.dispatchEvent(new CustomEvent(APP_STORAGE_EVENT, { detail: { key } }))
    } catch {
      /* SSR */
    }
    return true
  } catch {
    return false
  }
}

/** Подписка на наши записи в localStorage (см. writeJson) */
export function subscribeAppStorage(key, handler) {
  const listener = (e) => {
    if (e?.detail?.key !== key) return
    handler()
  }
  window.addEventListener(APP_STORAGE_EVENT, listener)
  return () => window.removeEventListener(APP_STORAGE_EVENT, listener)
}

