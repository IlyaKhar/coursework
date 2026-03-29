import { useEffect, useMemo, useState } from 'react'
import { StorageKeys } from '../../app/constants'
import { readJson, writeJson, subscribeAppStorage } from '../../shared/utils/storage'

const CALENDAR_KEY = 'smart-organizer.calendar.v1'
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function formatDate(value) {
  if (!value) return 'Дата не выбрана'
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(date)
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function mondayFirstWeekday(year, monthIndex) {
  const sundayFirst = new Date(year, monthIndex, 1).getDay()
  return sundayFirst === 0 ? 6 : sundayFirst - 1
}

function buildMonthMatrix(year, monthIndex) {
  const totalDays = daysInMonth(year, monthIndex)
  const firstWeekday = mondayFirstWeekday(year, monthIndex)
  const cells = []

  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= totalDays; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

/** Склонение «N задач» для русского */
function pluralTasksRu(n) {
  const abs = Math.abs(n) % 100
  const d = abs % 10
  if (abs > 10 && abs < 20) return 'задач'
  if (d === 1) return 'задача'
  if (d >= 2 && d <= 4) return 'задачи'
  return 'задач'
}

/** Сколько задач на каждый yyyy-mm-dd (пересчитывается при сохранении todos) */
function useTodoCountByDueDate() {
  const [rev, setRev] = useState(0)
  useEffect(() => subscribeAppStorage(StorageKeys.todos, () => setRev((n) => n + 1)), [])
  return useMemo(() => {
    void rev
    const raw = readJson(StorageKeys.todos, [])
    const counts = Object.create(null)
    if (!Array.isArray(raw)) return counts
    for (const t of raw) {
      const d = t?.dueDate
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) counts[d] = (counts[d] ?? 0) + 1
    }
    return counts
  }, [rev])
}

export default function CalendarPanel() {
  const countByDueDate = useTodoCountByDueDate()
  const [selectedDate, setSelectedDate] = useState(() => readJson(CALENDAR_KEY, ''))
  const [year, setYear] = useState(() => {
    const fromStorage = readJson(CALENDAR_KEY, '')
    if (!fromStorage) return new Date().getFullYear()
    return Number(fromStorage.slice(0, 4)) || new Date().getFullYear()
  })

  const humanDate = useMemo(() => formatDate(selectedDate), [selectedDate])
  const tasksOnSelected = useMemo(() => {
    if (!selectedDate) return 0
    return countByDueDate[selectedDate] ?? 0
  }, [countByDueDate, selectedDate])
  const todayIso = useMemo(() => toISODate(new Date()), [])
  const months = useMemo(
    () =>
      MONTHS.map((name, index) => ({
        name,
        index,
        cells: buildMonthMatrix(year, index),
      })),
    [year],
  )

  function applyDate(next) {
    setSelectedDate(next)
    writeJson(CALENDAR_KEY, next)
  }

  function pickDate(monthIndex, day) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    applyDate(iso)
  }

  return (
    <section className="calendar" aria-label="Планирование по дате">
      <div className="calendar__head calendar__head--row">
        <h2 className="calendar__title">Календарь</h2>
        <div className="calendar__yearNav">
          <button className="btn btn--tiny" onClick={() => setYear((y) => y - 1)} type="button" aria-label="Предыдущий год">
            {'<'}
          </button>
          <div className="calendar__year">{year}</div>
          <button className="btn btn--tiny" onClick={() => setYear((y) => y + 1)} type="button" aria-label="Следующий год">
            {'>'}
          </button>
        </div>
      </div>

      <div className="calendar__grid">
        {months.map((month) => (
          <article key={month.name} className="calendarMonth">
            <h3 className="calendarMonth__title">{month.name}</h3>
            <div className="calendarMonth__weekdays">
              {WEEKDAYS.map((d) => (
                <span key={`${month.name}-${d}`}>{d}</span>
              ))}
            </div>
            <div className="calendarMonth__days">
              {month.cells.map((day, idx) => {
                if (!day) return <span key={`${month.name}-empty-${idx}`} className="calendarMonth__day calendarMonth__day--empty" />
                const iso = `${year}-${String(month.index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = iso === selectedDate
                const isToday = iso === todayIso
                const n = countByDueDate[iso] ?? 0
                const hasDeadline = n > 0
                const title =
                  n === 0 ? undefined : `${n} ${pluralTasksRu(n)} на этот день`
                return (
                  <button
                    key={iso}
                    className={`calendarMonth__day ${isSelected ? 'calendarMonth__day--selected' : ''} ${isToday ? 'calendarMonth__day--today' : ''} ${hasDeadline ? 'calendarMonth__day--deadline' : ''}`}
                    onClick={() => pickDate(month.index, day)}
                    type="button"
                    title={title}>
                    {day}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="calendar__preview">
        <div className="calendar__previewTitle">Выбранная дата:</div>
        <div className="calendar__previewDate">{humanDate}</div>
        {selectedDate ? (
          <div className="calendar__previewTasks" role="status">
            На эту дату: <span className="calendar__previewTasksNum">{tasksOnSelected}</span> {pluralTasksRu(tasksOnSelected)}
          </div>
        ) : null}
        <button className="btn btn--tiny btn--danger" onClick={() => applyDate('')} type="button">
          Очистить дату
        </button>
      </div>
    </section>
  )
}

