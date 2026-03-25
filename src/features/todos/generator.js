import { Priority } from '../../app/constants'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function generateTodos(count = 8) {
  const titles = [
    'Разобрать почту',
    'Созвон с командой',
    'Сделать рефакторинг',
    'Подготовить демо',
    'Проверить сборку',
    'Обновить дизайн',
    'Написать DEVLOG',
    'Добавить хоткеи',
    'Починить localStorage',
  ]
  const desc = [
    'С коротким результатом и дедлайном.',
    'Без воды — только что и зачем.',
    'Проверить на мобиле и десктопе.',
    'Сделать по-человечески, без костылей.',
  ]
  const pr = [Priority.low, Priority.normal, Priority.high]

  return Array.from({ length: count }).map((_, i) => ({
    id: id(),
    title: `${pick(titles)} #${i + 1}`,
    description: Math.random() > 0.35 ? pick(desc) : '',
    priority: pick(pr),
    isDone: Math.random() > 0.72,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

