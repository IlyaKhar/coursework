import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { PriorityMeta } from '../../app/constants'
import { formatDueDateLabel, isIsoDateOverdue } from '../../shared/utils/dates'
import { createTodoDraft } from './types'
import { useTodos } from './useTodos'

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase()
  if (!tag) return false
  if (target?.isContentEditable) return true
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

function ProgressBar({ done, total, percent }) {
  const detail = total === 0 ? 'Нет задач' : `${done} из ${total} выполнено`
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={total === 0 ? 0 : percent}
      aria-label={`Прогресс: ${detail}`}>
      <div className="progress__label">
        <span>{detail}</span>
        <span>{total === 0 ? '—' : `${percent}%`}</span>
      </div>
      <div className="progress__track">
        <div className="progress__bar" style={{ width: `${total === 0 ? 0 : percent}%` }} />
      </div>
    </div>
  )
}

function PriorityPill({ priority }) {
  const meta = PriorityMeta[priority] ?? PriorityMeta.normal
  return (
    <span className="pill" style={{ borderColor: meta.color, color: meta.color }}>
      {meta.label}
    </span>
  )
}

function TodoModal({ isOpen, mode, initial, onClose, onSubmit }) {
  const [draft, setDraft] = useState(initial ?? createTodoDraft())
  const firstFieldRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setDraft(initial ? { ...createTodoDraft(), ...initial } : createTodoDraft())
  }, [initial, isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e) {
      // Ctrl+Enter сохраняет задачу из модального окна
      if (!e.ctrlKey || e.key !== 'Enter') return
      e.preventDefault()
      onSubmit(draft)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [draft, isOpen, onSubmit])

  return (
    <Dialog open={isOpen} onClose={onClose} initialFocus={firstFieldRef} className="modal">
      <div className="modal__backdrop" aria-hidden="true" />
      <div className="modal__wrap">
        <Dialog.Panel className="modal__panel">
          <Dialog.Title className="modal__title">{mode === 'edit' ? 'Редактировать задачу' : 'Новая задача'}</Dialog.Title>

          <div className="form">
            <label className="field">
              <span className="field__label">Заголовок</span>
              <input
                ref={firstFieldRef}
                className="field__input"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Например: Позвонить заказчику"
              />
            </label>

            <label className="field">
              <span className="field__label">Описание</span>
              <textarea
                className="field__input field__textarea"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Коротко: что сделать и какой результат"
              />
            </label>

            <label className="field">
              <span className="field__label">Приоритет</span>
              <select
                className="field__input"
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
                {Object.entries(PriorityMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Срок (необязательно)</span>
              <input
                className="field__input"
                type="date"
                value={draft.dueDate || ''}
                onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
              />
            </label>
          </div>

          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose} type="button">
              Отмена
            </button>
            <button className="btn btn--primary" onClick={() => onSubmit(draft)} type="button">
              Сохранить
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default function TodoApp() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleDone, stats } = useTodos()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingId, setEditingId] = useState(null)

  const editingTodo = useMemo(() => todos.find((t) => t.id === editingId) ?? null, [editingId, todos])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return todos
      .filter((t) => {
        if (filter === 'active') return !t.isDone
        if (filter === 'done') return t.isDone
        return true
      })
      .filter((t) => {
        if (!q) return true
        return `${t.title} ${t.description} ${t.dueDate ?? ''}`.toLowerCase().includes(q)
      })
  }, [filter, query, todos])

  function openCreate() {
    setModalMode('create')
    setEditingId(null)
    setIsModalOpen(true)
  }

  function openEdit(id) {
    setModalMode('edit')
    setEditingId(id)
    setIsModalOpen(true)
  }

  function submitModal(draft) {
    if (modalMode === 'edit' && editingId) updateTodo(editingId, draft)
    else addTodo(draft)
    setIsModalOpen(false)
  }

  useEffect(() => {
    function onKeyDown(e) {
      // В полях ввода шорткаты списка не перехватываем
      if (isTypingTarget(e.target)) return

      // Ctrl+N может перехватываться браузером, поэтому есть рабочий fallback Alt+N
      if ((e.ctrlKey && e.key.toLowerCase() === 'n') || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault()
        openCreate()
        return
      }

      if (e.key === 'Delete' && editingId && !isModalOpen) {
        e.preventDefault()
        deleteTodo(editingId)
        setEditingId(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [deleteTodo, editingId, isModalOpen])

  return (
    <div className="todo">
      <div className="todo__top">
        <div className="todo__topLeft">
          <div className="todo__title">Задачи</div>
          <div className="todo__hint">Горячие клавиши: Alt+N (новая), Ctrl+Enter (сохранить), Delete (удалить выбранную)</div>
        </div>
        <div className="todo__topRight">
          <button className="btn btn--primary" onClick={openCreate} type="button">
            + Новая
          </button>
        </div>
      </div>

      <div className="todo__toolbar">
        <div className="seg">
          <button className={`seg__btn ${filter === 'all' ? 'seg__btn--active' : ''}`} onClick={() => setFilter('all')} type="button">
            Все
          </button>
          <button className={`seg__btn ${filter === 'active' ? 'seg__btn--active' : ''}`} onClick={() => setFilter('active')} type="button">
            Активные
          </button>
          <button className={`seg__btn ${filter === 'done' ? 'seg__btn--active' : ''}`} onClick={() => setFilter('done')} type="button">
            Выполнено
          </button>
        </div>

        <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск…" />
      </div>

      <div className="todo__stats">
        <ProgressBar done={stats.done} total={stats.total} percent={stats.percent} />
        <div className="todo__chips">
          <span className="chip">
            Всего: <b>{stats.total}</b>
          </span>
          <span className="chip">
            Сделано: <b>{stats.done}</b>
          </span>
        </div>
      </div>

      <div className="todo__list" role="list">
        {visible.length === 0 ? (
          <div className="todo__empty">Пока пусто. Нажми «Новая».</div>
        ) : (
          visible.map((t) => (
            <div key={t.id} className={`todoItem ${editingId === t.id ? 'todoItem--active' : ''} ${t.isDone ? 'todoItem--done' : ''}`} role="listitem">
              <div
                className="todoItem__row"
                onClick={() => setEditingId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setEditingId(t.id)
                  }
                }}
                role="button"
                tabIndex={0}>
                <input
                  className="todoItem__check"
                  type="checkbox"
                  checked={t.isDone}
                  onChange={() => toggleDone(t.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Выполнено"
                />
                <div className="todoItem__main">
                  <div className="todoItem__title">{t.title}</div>
                  {t.description ? <div className="todoItem__desc">{t.description}</div> : null}
                  {t.dueDate ? (
                    <div className={`todoItem__due ${isIsoDateOverdue(t.dueDate, t.isDone) ? 'todoItem__due--overdue' : ''}`}>Срок: {formatDueDateLabel(t.dueDate)}</div>
                  ) : null}
                </div>
                <div className="todoItem__meta">
                  <PriorityPill priority={t.priority} />
                </div>
              </div>
              <div className="todoItem__actions">
                <button className="btn btn--tiny" onClick={() => openEdit(t.id)} type="button">
                  Редактировать
                </button>
                <button className="btn btn--tiny btn--danger" onClick={() => deleteTodo(t.id)} type="button">
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <TodoModal isOpen={isModalOpen} mode={modalMode} initial={modalMode === 'edit' ? editingTodo : null} onClose={() => setIsModalOpen(false)} onSubmit={submitModal} />
    </div>
  )
}
