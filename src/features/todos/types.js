import { Priority } from '../../app/constants'

export function createTodoDraft() {
  return {
    title: '',
    description: '',
    priority: Priority.normal,
    isDone: false,
    /** Срок yyyy-mm-dd или пусто */
    dueDate: '',
  }
}

