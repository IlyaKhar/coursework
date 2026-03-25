import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { PriorityMeta } from '../../app/constants'
import { createTodoDraft } from './types'
import { useTodos } from './useTodos'
import { generateTodos } from './generator'

function ProgressBar({ percent }) {
  return (
    <div className="progress" aria-label="Прогресс выполнения задач">
      <div className="progress__label">
        <span>Прогресс</span>
        <span>{percent}%</span>
      </div>
      <div className="progress__track">
        <div className="progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function PriorityPill({ priority }) {
  const meta = PriorityMeta[priority]
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
    if (isOpen) setDraft(initial ?? createTodoDraft())
  }, [initial, isOpen])

  useEffect(() => {
    function onKey(e) {
      if (!isOpen) return
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        onSubmit(draft)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
          </div>

          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={onClose} type="button">
              Отмена
            </button>
            <button className="btn btn--primary" onClick={() => onSubmit(draft)} type="button">
              Сохранить (Ctrl+Enter)
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default function TodoApp() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleDone, stats, setTodos } = useTodos()
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
        return `${t.title} ${t.description}`.toLowerCase().includes(q)
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

  function closeModal() {
    setIsModalOpen(false)
  }

  function submitModal(draft) {
    if (modalMode === 'edit' && editingId) updateTodo(editingId, draft)
    else addTodo(draft)
    setIsModalOpen(false)
  }

  useEffect(() => {
    function onKey(e) {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)

      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        openCreate()
        return
      }

      if (e.key === 'Delete' && !isInput) {
        if (!editingId) return
        e.preventDefault()
        deleteTodo(editingId)
        setEditingId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteTodo, editingId])

  function onGenerate() {
    const next = generateTodos()
    setTodos(next)
  }

  return (
    <div className="todo">
      <div className="todo__top">
        <div className="todo__topLeft">
          <div className="todo__title">Задачи</div>
          <div className="todo__hint">Ctrl+N — новая, Ctrl+Enter — сохранить, Delete — удалить выбранную</div>
        </div>
        <div className="todo__topRight">
          <button className="btn btn--ghost" onClick={onGenerate} type="button">
            Сгенерировать задачи
          </button>
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
        <ProgressBar percent={stats.percent} />
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
          <div className="todo__empty">Пока пусто. Нажми “Новая” или “Сгенерировать задачи”.</div>
        ) : (
          visible.map((t) => (
            <button
              key={t.id}
              className={`todoItem ${editingId === t.id ? 'todoItem--active' : ''} ${t.isDone ? 'todoItem--done' : ''}`}
              onClick={() => setEditingId(t.id)}
              type="button">
              <div className="todoItem__row">
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
                </div>
                <div className="todoItem__meta">
                  <PriorityPill priority={t.priority} />
                </div>
              </div>
              <div className="todoItem__actions">
                <button className="btn btn--tiny" onClick={(e) => (e.stopPropagation(), openEdit(t.id))} type="button">
                  Редактировать
                </button>
                <button className="btn btn--tiny btn--danger" onClick={(e) => (e.stopPropagation(), deleteTodo(t.id))} type="button">
                  Удалить
                </button>
              </div>
            </button>
          ))
        )}
      </div>

      <TodoModal
        isOpen={isModalOpen}
        mode={modalMode}
        initial={modalMode === 'edit' ? editingTodo : null}
        onClose={closeModal}
        onSubmit={submitModal}
      />
    </div>
  )
}

