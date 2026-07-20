'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications, markNotificationsRead, type AppNotification } from '@/app/(app)/leaderboard/notification-actions'

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)  return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const NOTIF_TEXT: Record<AppNotification['type'], string> = {
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onRead: () => void
}

export function NotificationPanel({ open, onClose, onRead }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const hasMarked = useRef(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getNotifications().then(data => {
      setNotifications(data)
      setLoading(false)
    })
    if (!hasMarked.current) {
      hasMarked.current = true
      markNotificationsRead().then(() => onRead())
    }
  }, [open, onRead])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const G = { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 420,
            backgroundColor: '#fff',
            border: '1px solid rgba(26,25,22,0.10)',
            borderRadius: 12,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(26,25,22,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...G, fontSize: '0.82rem', color: '#1a1916' }}>Notifications</span>
            {notifications.some(n => !n.read) && (
              <span style={{ ...G, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,25,22,0.38)' }}>
                marking read...
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', scrollbarWidth: 'none', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', ...G, fontSize: '0.78rem', color: 'rgba(26,25,22,0.35)' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ ...G, fontSize: '0.82rem', color: 'rgba(26,25,22,0.35)' }}>Nothing here yet</p>
                <p style={{ ...G, fontSize: '0.72rem', color: 'rgba(26,25,22,0.25)', marginTop: 4 }}>Friend requests and acceptances appear here</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(26,25,22,0.04)',
                    backgroundColor: n.read ? 'transparent' : 'rgba(26,25,22,0.025)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(26,25,22,0.10)', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={n.from_avatar_url ?? '/illustrations/avatar-user.png'}
                      alt={n.from_display_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...G, fontSize: '0.78rem', color: '#1a1916', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 600 }}>{n.from_display_name}</strong>
                      {' '}{NOTIF_TEXT[n.type]}
                    </p>
                    <p style={{ ...G, fontSize: '0.65rem', color: 'rgba(26,25,22,0.38)', marginTop: 2 }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1a1916', marginTop: 5, flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
