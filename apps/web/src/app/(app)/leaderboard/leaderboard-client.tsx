'use client'

import { useState, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LeaderboardEntry } from '@maable/core'
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  type UserSearchResult,
  type FriendRequest,
} from './friends-actions'

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const colors = ['#c9a84c', '#b0b0b0', '#a07040']
  if (rank <= 3) return (
    <span className="text-sm w-7 text-right shrink-0 font-semibold" style={{ fontFamily: 'Georgia, serif', color: colors[rank - 1] }}>
      {rank}
    </span>
  )
  return <span className="text-sm text-stone-400 w-7 text-right shrink-0" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{rank}</span>
}

// ─── XP bar ───────────────────────────────────────────────────────────────────

function XpBar({ xp, level }: { xp: number; level: number }) {
  const progress = Math.min((xp - (level - 1) * 1000) / 1000, 1)
  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex-1 h-1 bg-stone-100 overflow-hidden">
        <motion.div className="h-full bg-stone-800" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.1 }} />
      </div>
      <span className="text-xs text-stone-400 shrink-0 tabular-nums">{xp.toLocaleString()} xp</span>
    </div>
  )
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderRow({ entry, isCurrentUser, index }: { entry: LeaderboardEntry; isCurrentUser: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      className="flex items-center gap-4 px-6 py-3.5"
      style={{ backgroundColor: isCurrentUser ? 'rgba(26,25,22,0.04)' : 'transparent', borderLeft: isCurrentUser ? '2px solid #1a1916' : '2px solid transparent' }}
    >
      <div className="w-8 flex justify-end shrink-0"><RankBadge rank={entry.rank} /></div>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-100 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.avatar_url ?? '/illustrations/avatar-user.png'} alt={entry.display_name} className="w-full h-full object-cover" />
      </div>
      <div className="w-36 shrink-0">
        <p className="text-sm text-stone-800 leading-snug truncate" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: isCurrentUser ? 600 : 400 }}>{entry.display_name}</p>
        <p className="text-xs text-stone-400">Lv.{entry.level}</p>
      </div>
      <XpBar xp={entry.total_xp} level={entry.level} />
    </motion.div>
  )
}

// ─── Friend search result row ─────────────────────────────────────────────────

function SearchResultRow({ result, onAdd }: { result: UserSearchResult; onAdd: (id: string) => void }) {
  const statusLabel: Record<UserSearchResult['friendship_status'], string> = {
    none: '+ Add',
    pending_sent: 'Pending',
    pending_received: 'Accept?',
    accepted: 'Friends',
  }
  const canAdd = result.friendship_status === 'none'

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(26,25,22,0.05)' }}>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-100 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result.avatar_url ?? '/illustrations/avatar-user.png'} alt={result.display_name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800 truncate" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{result.display_name}</p>
        <p className="text-xs text-stone-400">@{result.username} · Lv.{result.level}</p>
      </div>
      <button
        onClick={() => canAdd && onAdd(result.id)}
        disabled={!canAdd}
        className="text-xs px-3 py-1.5 transition-colors shrink-0"
        style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          backgroundColor: canAdd ? '#1a1916' : 'transparent',
          color: canAdd ? '#fff' : '#a8a29e',
          border: canAdd ? 'none' : '1px solid rgba(26,25,22,0.12)',
          cursor: canAdd ? 'pointer' : 'default',
        }}
      >
        {statusLabel[result.friendship_status]}
      </button>
    </div>
  )
}

// ─── Pending request row ──────────────────────────────────────────────────────

function PendingRow({ req, onRespond }: { req: FriendRequest; onRespond: (id: string, action: 'accept' | 'decline') => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(26,25,22,0.05)' }}>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-100 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={req.avatar_url ?? '/illustrations/avatar-user.png'} alt={req.display_name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800 truncate" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{req.display_name}</p>
        <p className="text-xs text-stone-400">wants to be friends</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onRespond(req.requester_id, 'accept')} className="text-xs px-3 py-1.5 bg-stone-900 text-white cursor-pointer" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Accept</button>
        <button onClick={() => onRespond(req.requester_id, 'decline')} className="text-xs px-3 py-1.5 text-stone-400 border border-stone-200 cursor-pointer" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Decline</button>
      </div>
    </div>
  )
}

// ─── Friends drawer ───────────────────────────────────────────────────────────

function FriendsDrawer({
  initialRequests,
  onClose,
}: {
  initialRequests: FriendRequest[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>(initialRequests)
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const res = await searchUsers(q)
    setResults(res)
    setSearching(false)
  }, [])

  const handleAdd = (id: string) => {
    startTransition(async () => {
      await sendFriendRequest(id)
      setResults(prev => prev.map(r => r.id === id ? { ...r, friendship_status: 'pending_sent' } : r))
    })
  }

  const handleRespond = (requesterId: string, action: 'accept' | 'decline') => {
    startTransition(async () => {
      await respondToFriendRequest(requesterId, action)
      setRequests(prev => prev.filter(r => r.requester_id !== requesterId))
    })
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="absolute inset-y-0 right-0 z-20 flex flex-col bg-white"
      style={{ width: 360, borderLeft: '1px solid rgba(26,25,22,0.08)', boxShadow: '-8px 0 32px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
        <p className="text-base text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Find friends</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none">✕</button>
      </div>

      {/* Search input */}
      <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search by name or username..."
          autoFocus
          className="w-full text-sm text-stone-700 placeholder-stone-400 focus:outline-none"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '8px 12px', border: '1px solid rgba(26,25,22,0.12)', backgroundColor: 'rgba(26,25,22,0.02)' }}
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Search results */}
        {query.length >= 2 && (
          <div>
            <p className="px-4 py-2 text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              {searching ? 'Searching...' : results.length === 0 ? 'No results' : 'Results'}
            </p>
            {results.map(r => (
              <SearchResultRow key={r.id} result={r} onAdd={handleAdd} />
            ))}
          </div>
        )}

        {/* Pending incoming requests */}
        {requests.length > 0 && (
          <div>
            <p className="px-4 pt-4 pb-2 text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Friend requests ({requests.length})
            </p>
            {requests.map(r => (
              <PendingRow key={r.requester_id} req={r} onRespond={handleRespond} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.length < 2 && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-16 opacity-50">
            <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Search for someone to add
            </p>
          </div>
        )}
      </div>

      {isPending && (
        <div className="px-5 py-2 text-xs text-stone-400 text-center" style={{ fontFamily: 'Georgia, serif' }}>Saving...</div>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LeaderboardClient({
  global,
  friends,
  currentUserId,
  incomingRequests,
}: {
  global: LeaderboardEntry[]
  friends: LeaderboardEntry[]
  currentUserId: string
  incomingRequests: FriendRequest[]
}) {
  const [tab, setTab] = useState<'global' | 'friends'>('global')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const entries = tab === 'global' ? global : friends
  const currentUserRank = entries.find(e => e.user_id === currentUserId)

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] bg-white overflow-hidden relative">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex flex-col shrink-0 py-8 pl-10 pr-6" style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)' }}>
        <h1 className="text-4xl text-stone-900 mb-2 leading-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Leaderboard</h1>
        <p className="text-sm text-stone-400 mb-8">{entries.length} players</p>

        {/* Tabs */}
        <div className="flex flex-col gap-1.5 mb-4">
          {(['global', 'friends'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="text-left px-3 py-2 text-sm transition-colors"
              style={{ backgroundColor: tab === t ? '#1a1916' : 'transparent', color: tab === t ? '#fff' : '#78716c', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {t === 'global' ? 'Global' : 'Friends'}
            </button>
          ))}
        </div>

        {/* Find friends button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
          style={{ color: '#78716c', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: '1px solid rgba(26,25,22,0.1)' }}
        >
          <span>+ Find friends</span>
          {incomingRequests.length > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center" style={{ fontFamily: 'monospace' }}>
              {incomingRequests.length}
            </span>
          )}
        </button>

        {/* My rank */}
        {currentUserRank && (
          <div className="mt-auto pt-6 pb-4">
            <p className="text-xs text-stone-300 mb-1.5">Your rank</p>
            <p className="text-3xl text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>#{currentUserRank.rank}</p>
            <p className="text-xs text-stone-400 mt-1">{currentUserRank.total_xp.toLocaleString()} xp · Lv.{currentUserRank.level}</p>
          </div>
        )}

        <div className={currentUserRank ? '' : 'flex-1'} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/category-career.png" alt="" className="w-28 opacity-20 object-contain self-center" draggable={false} />
      </aside>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <style>{`main::-webkit-scrollbar { display: none; }`}</style>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/chibi-grumpy.png" alt="" className="w-28 h-28 object-contain opacity-40" draggable={false} />
            <p className="text-stone-400 text-sm" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {tab === 'friends' ? 'No friends yet — add some!' : 'No players yet'}
            </p>
            {tab === 'friends' && (
              <button onClick={() => setDrawerOpen(true)} className="text-xs text-stone-400 border-b border-stone-200 pb-0.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Find friends →
              </button>
            )}
          </div>
        ) : (
          <div className="py-8">
            {/* Top 3 podium */}
            {entries.slice(0, 3).length > 0 && (
              <div className="flex items-end justify-center gap-6 px-10 mb-10">
                {[entries[1], entries[0], entries[2]].filter(Boolean).map((entry, i) => {
                  if (!entry) return null
                  const heights = [80, 112, 64]
                  const isMe = entry.user_id === currentUserId
                  return (
                    <motion.div key={entry.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 22 }} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 mb-2" style={{ borderColor: isMe ? '#1a1916' : 'rgba(26,25,22,0.12)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.avatar_url ?? '/illustrations/avatar-user.png'} alt={entry.display_name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-stone-600 mb-1 max-w-[80px] truncate text-center" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{entry.display_name}</p>
                      <div className="w-16 flex items-center justify-center" style={{ height: heights[i], backgroundColor: i === 1 ? '#1a1916' : 'rgba(26,25,22,0.07)' }}>
                        <RankBadge rank={entry.rank} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Full list */}
            <div className="divide-y divide-stone-50">
              {entries.map((entry, i) => (
                <LeaderRow key={entry.user_id} entry={entry} isCurrentUser={entry.user_id === currentUserId} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Friends drawer ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <FriendsDrawer
            initialRequests={incomingRequests}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
