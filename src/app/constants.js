export const StorageKeys = {
  todos: 'smart-organizer.todos.v1',
  ui: 'smart-organizer.ui.v1',
}

export const Priority = {
  low: 'low',
  normal: 'normal',
  high: 'high',
}

export const PriorityMeta = {
  [Priority.low]: { label: 'Низкий', color: '#22c55e' },
  [Priority.normal]: { label: 'Обычный', color: '#475569' },
  [Priority.high]: { label: 'Высокий', color: '#ef4444' },
}
