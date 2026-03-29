/** Дата в формате yyyy-mm-dd по локальному календарю */
export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dueFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

/** Человекочитаемый срок из yyyy-mm-dd */
export function formatDueDateLabel(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const date = new Date(`${iso}T12:00:00`)
  return dueFmt.format(date)
}

export function isIsoDateOverdue(iso, isDone) {
  if (isDone || !iso) return false
  const today = toISODate(new Date())
  return iso < today
}
