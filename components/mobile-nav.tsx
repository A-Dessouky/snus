'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Home, Megaphone, Calendar, CheckSquare, Trophy,
  CreditCard, FileText, Users, Database, Bell,
  DollarSign, User, X, Menu, LogOut, Heart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Role } from '@/lib/types'

const MAIN_NAV = [
  { href: '/home',           label: 'Home',          icon: Home },
  { href: '/announcements',  label: 'Posts',         icon: Megaphone },
  { href: '/social-calendar',label: 'Calendar',      icon: Calendar },
  { href: '/task-board',     label: 'Tasks',         icon: CheckSquare },
  { href: '/notifications',  label: 'Alerts',        icon: Bell },
]

const ALL_NAV = [
  { href: '/home',              label: 'Home',            icon: Home,        roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/announcements',     label: 'Announcements',   icon: Megaphone,   roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/social-calendar',   label: 'Social Calendar', icon: Calendar,    roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/task-board',        label: 'Task Board',      icon: CheckSquare, roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/house-points',      label: 'House Points',    icon: Trophy,      roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/dues',              label: 'Dues',            icon: CreditCard,  roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/philanthropy',      label: 'Philanthropy',    icon: Heart,       roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/documents',         label: 'Documents',       icon: FileText,    roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/rush-database',     label: 'Rush Database',   icon: Database,    roles: ['rush_chair','exec'] },
  { href: '/finances',          label: 'Finances',        icon: DollarSign,  roles: ['social_chair','exec'] },
  { href: '/member-management', label: 'Members',         icon: Users,       roles: ['exec'] },
  { href: '/notifications',     label: 'Notifications',   icon: Bell,        roles: ['member','social_chair','rush_chair','exec'] },
  { href: '/profile',           label: 'My Profile',      icon: User,        roles: ['member','social_chair','rush_chair','exec'] },
] as const

const ROLE_LABELS: Record<Role, string> = {
  member: 'Member', social_chair: 'Social Chair', rush_chair: 'Rush Chair', exec: 'Exec',
}

export function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleAll = ALL_NAV.filter(item => (item.roles as readonly string[]).includes(profile.role))

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-40 flex md:hidden">
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-yellow-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-zinc-500"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Profile info */}
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-bold text-zinc-900">
                {(profile.full_name ?? profile.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{profile.full_name ?? profile.email}</p>
                <p className="text-zinc-400 text-xs">{ROLE_LABELS[profile.role]}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="ml-auto p-1.5 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <div className="px-3 py-2 grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
              {visibleAll.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-yellow-500 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Sign out */}
            <div className="px-5 py-4 border-t border-zinc-800">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400 font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
