'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Megaphone, Calendar, CheckSquare, Trophy, DollarSign,
  FileText, Users, Database, Bell, LogOut, CreditCard, User, Heart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Role } from '@/lib/types'

const NAV = [
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
    <aside className="w-56 flex flex-col shrink-0" style={{ background: 'linear-gradient(180deg, #18181b 0%, #111113 100%)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xl font-bold tracking-tight" style={{ color: '#F5C842', letterSpacing: '-0.02em' }}>ΣΝ SNUS</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Stanford University</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'text-zinc-900'
                  : 'hover:bg-white/6 text-zinc-500 hover:text-zinc-200'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, #F5C842 0%, #E6B422 100%)',
                boxShadow: '0 2px 12px rgba(245,200,66,0.25)',
              } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-zinc-900 shrink-0" style={{ background: '#F5C842' }}>
            {(profile.full_name ?? profile.email)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile.full_name ?? profile.email}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm transition-colors hover:bg-white/6"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
