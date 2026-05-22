'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, MapPin, Clock } from 'lucide-react'
import { EditEventButton } from './edit-event-modal'

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function CalendarGrid({ events, canManage }: { events: Event[]; canManage: boolean }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Event[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDay: Record<string, Event[]> = {}
  events.forEach(e => {
    const d = new Date(e.start_time)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString()
      if (!eventsByDay[key]) eventsByDay[key] = []
      eventsByDay[key].push(e)
    }
  })

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const handleDayClick = (day: number) => {
    const key = day.toString()
    setSelectedDate(`${MONTHS[month]} ${day}, ${year}`)
    setSelected(eventsByDay[key] ?? [])
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const hasEvents = day !== null && !!eventsByDay[day.toString()]
            return (
              <div
                key={i}
                onClick={() => day && handleDayClick(day)}
                className={`min-h-[72px] p-1.5 border-b border-r border-gray-100 ${day ? 'cursor-pointer hover:bg-yellow-50' : ''} ${i % 7 === 6 ? 'border-r-0' : ''}`}
              >
                {day && (
                  <>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday(day) ? 'bg-yellow-500 text-zinc-900 font-bold' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {(eventsByDay[day.toString()] ?? []).slice(0, 2).map(e => (
                        <div key={e.id} className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded truncate font-medium">
                          {e.title}
                        </div>
                      ))}
                      {(eventsByDay[day.toString()] ?? []).length > 2 && (
                        <p className="text-xs text-gray-400 pl-1">+{eventsByDay[day.toString()].length - 2} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selected !== null && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{selectedDate}</h3>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {selected.length === 0 ? (
            <p className="text-sm text-gray-400">No events this day.</p>
          ) : (
            <div className="space-y-3">
              {selected.map(e => (
                <div key={e.id} className="border border-gray-100 rounded-lg p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{e.title}</p>
                    {canManage && <EditEventButton event={e} />}
                  </div>
                  {e.description && <p className="text-sm text-gray-600">{e.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(e.start_time)}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
