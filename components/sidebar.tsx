'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Megaphone, Calendar, CheckSquare, Trophy, DollarSign,
  FileText, Users, Database, Bell, LogOut, CreditCard, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Role } from '@/lib/types'

const NAV = [
  { href: '/home',             label: 'Home',            icon: Home,        roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/announcements',    label: 'Announcements',   icon: Megaphone,   roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/social-calendar',  label: 'Social Calendar', icon: Calendar,    roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/task-board',       label: 'Task Board',      icon: CheckSquare, roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/house-points',     label: 'House Points',    icon: Trophy,      roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/dues',             label: 'Dues',            icon: CreditCard,  roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/documents',        label: 'Documents',       icon: FileText,    roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/rush-database',    label: 'Rush Database',   icon: Database,    roles: ['rush_chair', 'exec'] },
  { href: '/finances',         label: 'Finances',        icon: DollarSign,  roles: ['social_chair', 'exec'] },
  { href: '/member-management',label: 'Members',         icon: Users,       roles: ['exec'] },
  { href: '/notifications',    label: 'Notifications',   icon: Bell,        roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
  { href: '/profile',          label: 'My Profile',      icon: User,        roles: ['member', 'social_chair', 'rush_chair', 'exec'] },
] as const

const ROLE_LABELS: Record<Role, string> = {
  member:       'Member',
  social_chair: 'Social Chair',
  rush_chair:   'Rush Chair',
  exec:         'Exec',
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleNav = NAV.filter(item => (item.roles as readonly string[]).includes(profile.role))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex flex-col bg-zinc-900 text-white shrink-0">
      <div className="px-5 py-6 border-b border-zinc-800">
        <p className="text-2xl font-bold text-yellow-400">ΣΝ SNUS</p>
        <p className="text-xs text-zinc-400 mt-0.5">Stanford University</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-yellow-500 text-zinc-900'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-zinc-900">
              {(profile.full_name ?? profile.email)[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile.full_name ?? profile.email}</p>
            <p className="text-xs text-zinc-400">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
