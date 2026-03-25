import { useCallback, useMemo, useState } from 'react'
import { StorageKeys, Priority } from '../../app/constants'
import { readJson, writeJson } from '../../shared/utils/storage'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeTodo(input) {
  const title = String(input?.title ?? '').trim()
  const description = String(input?.description ?? '').trim()
  const priority = input?.priority ?? Priority.normal
  const isDone = Boolean(input?.isDone ?? false)

  return { title, description, priority, isDone }
}

export function useTodos() {
  const [todos, setTodos] = useState(() => readJson(StorageKeys.todos, []))

  const persist = useCallback((next) => {
    setTodos(next)
    writeJson(StorageKeys.todos, next)
  }, [])

  const addTodo = useCallback(
    (draft) => {
      const base = normalizeTodo(draft)
      if (!base.title) return { ok: false, error: 'Пустой заголовок' }
      const next = [
        {
          id: createId(),
          ...base,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...todos,
      ]
      persist(next)
      return { ok: true }
    },
    [persist, todos],
  )

  const updateTodo = useCallback(
    (id, patch) => {
      const next = todos.map((t) => {
        if (t.id !== id) return t
        const base = normalizeTodo({ ...t, ...patch })
        if (!base.title) return t
        return { ...t, ...base, updatedAt: nowIso() }
      })
      persist(next)
      return { ok: true }
    },
    [persist, todos],
  )

  const deleteTodo = useCallback(
    (id) => {
      const next = todos.filter((t) => t.id !== id)
      persist(next)
    },
    [persist, todos],
  )

  const toggleDone = useCallback(
    (id) => {
      const next = todos.map((t) => (t.id === id ? { ...t, isDone: !t.isDone, updatedAt: nowIso() } : t))
      persist(next)
    },
    [persist, todos],
  )

  const stats = useMemo(() => {
    const total = todos.length
    const done = todos.filter((t) => t.isDone).length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return { total, done, percent }
  }, [todos])

  return { todos, addTodo, updateTodo, deleteTodo, toggleDone, stats, setTodos: persist }
}

