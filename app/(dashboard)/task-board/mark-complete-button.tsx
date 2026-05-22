'use client'

import { useState } from 'react'
import { markTaskComplete } from './actions'

export function MarkCompleteButton({ taskId }: { taskId: string }) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    await markTaskComplete(taskId)
    setPending(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-yellow-600 hover:text-yellow-700 font-medium disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Mark complete'}
    </button>
  )
}
