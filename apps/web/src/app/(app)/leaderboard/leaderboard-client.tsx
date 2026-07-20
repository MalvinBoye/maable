'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LeaderboardEntry } from '@maable/core'
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  type UserSearchResult,
  type FriendRequest,
} from './friends-actions'
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  type FriendInfo,
  type ChatMessage,
} from './chat-actions'
import { createClient } from '@/lib/supabase/client'

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

// ─── Friends drawer (find/add) ────────────────────────────────────────────────

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
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
        <p className="text-base text-stone-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Find friends</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none">✕</button>
      </div>

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
        {query.length >= 2 && (
          <div>
            <p className="px-4 py-2 text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              {searching ? 'Searching...' : results.length === 0 ? 'No results' : 'Results'}
            </p>
            {results.map(r => <SearchResultRow key={r.id} result={r} onAdd={handleAdd} />)}
          </div>
        )}

        {requests.length > 0 && (
          <div>
            <p className="px-4 pt-4 pb-2 text-xs text-stone-400 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Friend requests ({requests.length})
            </p>
            {requests.map(r => <PendingRow key={r.requester_id} req={r} onRespond={handleRespond} />)}
          </div>
        )}

        {query.length < 2 && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-16 opacity-50">
            <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Search for someone to add</p>
          </div>
        )}
      </div>

      {isPending && (
        <div className="px-5 py-2 text-xs text-stone-400 text-center" style={{ fontFamily: 'Georgia, serif' }}>Saving...</div>
      )}
    </motion.div>
  )
}

// ─── Chat drawer ──────────────────────────────────────────────────────────────

function ChatDrawer({
  friend,
  currentUserId,
  onClose,
}: {
  friend: FriendInfo
  currentUserId: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const G = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }

  // Load history + mark read + Realtime
  useEffect(() => {
    let active = true
    getMessages(friend.id).then(msgs => {
      if (active) { setMessages(msgs); setLoading(false) }
    })
    markMessagesRead(friend.id)

    // Realtime: listen for new messages I receive
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${currentUserId}:${friend.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${currentUserId}` },
        payload => {
          const msg = payload.new as ChatMessage
          if (msg.sender_id === friend.id) {
            setMessages(prev => [...prev, msg])
            markMessagesRead(friend.id)
          }
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend.id, currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    // Optimistic add
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      recipient_id: friend.id,
      content: text,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { error } = await sendMessage(friend.id, text)
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(text)
      setSendError('Could not send — make sure the chat migration is applied in Supabase')
      setTimeout(() => setSendError(null), 5000)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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
      <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(26,25,22,0.07)' }}>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-100 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={friend.avatar_url ?? '/illustrations/avatar-user.png'} alt={friend.display_name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800 truncate" style={{ ...G }}>{friend.display_name}</p>
          <p className="text-xs text-stone-400">@{friend.username}</p>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-lg leading-none shrink-0">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ ...G, fontSize: '0.78rem', color: 'rgba(26,25,22,0.35)' }}>Loading...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-8 opacity-50">
            <p style={{ ...G, fontSize: '0.85rem', color: '#78716c' }}>No messages yet</p>
            <p style={{ ...G, fontSize: '0.72rem', color: '#a8a29e' }}>Say something to {friend.display_name}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === currentUserId
            const showTime = i === 0 || (new Date(msg.created_at).getTime() - new Date(messages[i - 1]!.created_at).getTime()) > 300_000
            return (
              <div key={msg.id}>
                {showTime && (
                  <p style={{ ...G, fontSize: '0.62rem', color: 'rgba(26,25,22,0.30)', textAlign: 'center', margin: '4px 0' }}>
                    {fmtTime(msg.created_at)}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '8px 12px',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: isMine ? '#1a1916' : 'rgba(26,25,22,0.06)',
                      ...G,
                      fontSize: '0.82rem',
                      color: isMine ? '#fff' : '#1a1916',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      opacity: msg.id.startsWith('opt-') ? 0.6 : 1,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(26,25,22,0.07)' }}>
        {sendError && (
          <p style={{ ...G, fontSize: '0.68rem', color: '#dc2626', marginBottom: 6 }}>{sendError}</p>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={`Message ${friend.display_name}...`}
            disabled={sending}
            autoFocus
            style={{
              flex: 1, ...G, fontSize: '0.82rem', color: '#1a1916',
              border: '1px solid rgba(26,25,22,0.12)',
              borderRadius: 20, padding: '8px 14px',
              backgroundColor: 'rgba(26,25,22,0.02)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              backgroundColor: input.trim() && !sending ? '#1a1916' : 'rgba(26,25,22,0.10)',
              border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background-color 0.15s',
            }}
          >
            <span style={{ color: input.trim() && !sending ? '#fff' : 'rgba(26,25,22,0.35)', fontSize: '0.9rem', marginLeft: 1 }}>→</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LeaderboardClient({
  global,
  friends,
  currentUserId,
  incomingRequests,
  friendsList,
}: {
  global: LeaderboardEntry[]
  friends: LeaderboardEntry[]
  currentUserId: string
  incomingRequests: FriendRequest[]
  friendsList: FriendInfo[]
}) {
  const [tab, setTab] = useState<'global' | 'friends'>('global')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [chatFriend, setChatFriend] = useState<FriendInfo | null>(null)

  // Maintain local unread counts so they clear when you open a chat
  const [localFriends, setLocalFriends] = useState<FriendInfo[]>(friendsList)

  const entries = tab === 'global' ? global : friends
  const currentUserRank = entries.find(e => e.user_id === currentUserId)

  const openChat = (f: FriendInfo) => {
    setChatFriend(f)
    setDrawerOpen(false)
    // Clear unread badge locally
    setLocalFriends(prev => prev.map(lf => lf.id === f.id ? { ...lf, unread_count: 0 } : lf))
  }

  const totalUnread = localFriends.reduce((s, f) => s + f.unread_count, 0)

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] bg-white overflow-hidden relative">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex flex-col shrink-0 py-8 pl-10 pr-6 overflow-y-auto" style={{ width: 260, borderRight: '1px solid rgba(26,25,22,0.07)', scrollbarWidth: 'none' }}>
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
          onClick={() => { setDrawerOpen(true); setChatFriend(null) }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors mb-5"
          style={{ color: '#78716c', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: '1px solid rgba(26,25,22,0.1)' }}
        >
          <span>+ Find friends</span>
          {incomingRequests.length > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center" style={{ fontFamily: 'monospace' }}>
              {incomingRequests.length}
            </span>
          )}
        </button>

        {/* Friends chat list */}
        {localFriends.length > 0 && (
          <div>
            <p className="text-xs text-stone-300 mb-2 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-stone-900 text-white text-xs" style={{ fontFamily: 'monospace' }}>
                  {totalUnread}
                </span>
              )}
            </p>
            <div className="flex flex-col gap-0.5">
              {localFriends.map(f => (
                <button
                  key={f.id}
                  onClick={() => openChat(f)}
                  className="flex items-center gap-2.5 px-2 py-2 text-left rounded transition-colors"
                  style={{
                    backgroundColor: chatFriend?.id === f.id ? 'rgba(26,25,22,0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (chatFriend?.id !== f.id) e.currentTarget.style.backgroundColor = 'rgba(26,25,22,0.03)' }}
                  onMouseLeave={e => { if (chatFriend?.id !== f.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-stone-100 shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.avatar_url ?? '/illustrations/avatar-user.png'} alt={f.display_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="flex-1 text-xs text-stone-700 truncate" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {f.display_name}
                  </span>
                  {f.unread_count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0" style={{ fontFamily: 'monospace', fontSize: 9 }}>
                      {f.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
        <img src="/illustrations/category-career.png" alt="" className="w-28 opacity-20 object-contain self-center mt-4" draggable={false} />
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

            <div className="divide-y divide-stone-50">
              {entries.map((entry, i) => (
                <LeaderRow key={entry.user_id} entry={entry} isCurrentUser={entry.user_id === currentUserId} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Drawers ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && !chatFriend && (
          <FriendsDrawer
            key="find"
            initialRequests={incomingRequests}
            onClose={() => setDrawerOpen(false)}
          />
        )}
        {chatFriend && (
          <ChatDrawer
            key={`chat-${chatFriend.id}`}
            friend={chatFriend}
            currentUserId={currentUserId}
            onClose={() => setChatFriend(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
