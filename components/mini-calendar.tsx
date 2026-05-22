'use client'

import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  start_time: string
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function MiniCalendar({ events }: { events: Event[] }) {
  const router = useRouter()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build set of days that have events this month
  const eventDays = new Set<number>()
  events.forEach(e => {
    const d = new Date(e.start_time)
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventDays.add(d.getDate())
    }
  })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div
      onClick={() => router.push('/social-calendar')}
      className="glass-card p-5 cursor-pointer transition-all hover:shadow-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm text-gray-900">{MONTHS[month]} {year}</p>
        <span className="text-xs text-gray-400 hover:text-gray-600">View →</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          const isToday = day === today.getDate()
          const hasEvent = day !== null && eventDays.has(day)
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              {day !== null ? (
                <>
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                    isToday
                      ? 'bg-yellow-500 text-zinc-900 font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    {day}
                  </span>
                  {hasEvent && (
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-zinc-900' : 'bg-yellow-500'}`} />
                  )}
                </>
              ) : (
                <span className="w-6 h-6" />
              )}
            </div>
          )
        })}
      </div>

      {eventDays.size > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          {eventDays.size} event{eventDays.size !== 1 ? 's' : ''} this month
        </p>
      )}
    </div>
  )
}
