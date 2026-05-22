'use client'

import { useState } from 'react'
import { removeMember, updateMemberRole } from './actions'

const ROLES = [
  { value: 'member',       label: 'Member' },
  { value: 'social_chair', label: 'Social Chair' },
  { value: 'rush_chair',   label: 'Rush Chair' },
  { value: 'exec',         label: 'Exec' },
]

export function RemoveButton({ id, name }: { id: string; name: string }) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!confirm(`Remove ${name} from the chapter? This cannot be undone.`)) return
    setPending(true)
    await removeMember(id)
    setPending(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}

export function RoleSelect({ id, currentRole }: { id: string; currentRole: string }) {
  const [pending, setPending] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPending(true)
    await updateMemberRole(id, e.target.value)
    setPending(false)
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={pending}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
    >
      {ROLES.map(r => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  )
}
