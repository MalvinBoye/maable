'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Flame, BookOpen, Trophy, User, LayoutDashboard, Settings } from 'lucide-react'
import type { Profile } from '@maable/core'
import { xpProgress } from '@maable/core'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

interface AppSidebarProps {
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const xp = xpProgress(profile?.total_xp ?? 0)

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <span className="text-xl font-bold xp-gradient bg-clip-text text-transparent">Maable</span>
      </div>

      {/* XP bar */}
      {profile && (
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-400">Level {xp.level}</span>
            <span className="text-xs text-zinc-500">{xp.current}/{xp.required} XP</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xp.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Settings + avatar */}
      <div className="border-t border-zinc-800 p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        {profile && (
          <div className="mt-2 flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {profile.display_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{profile.display_name}</p>
              <p className="text-xs text-zinc-500 truncate">@{profile.username}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
