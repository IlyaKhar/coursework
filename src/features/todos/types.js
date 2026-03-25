import { Priority } from '../../app/constants'

export function createTodoDraft() {
  return {
    title: '',
    description: '',
    priority: Priority.normal,
    isDone: false,
  }
}

