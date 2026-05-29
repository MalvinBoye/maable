'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// MusicKit JS instance shape (subset we actually use)
interface MKInstance {
  isAuthorized: boolean
  currentPlaybackTime?: number
  nowPlayingItem: {
    title?: string
    artistName?: string
    albumName?: string
    artwork?: { url?: string }
    playbackDuration?: number
  } | null
}

function getMusicKit(): MKInstance | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mk = (window as any).MusicKit
    if (!mk) return null
    return mk.getInstance?.() ?? null
  } catch { return null }
}

interface Track {
  name: string
  artist: string
  album: string
  albumArt: string | null
  url: string
  progress: number
  duration: number
}

interface NowPlayingState {
  connected: boolean
  playing: boolean
  track?: Track
}

function ProgressBar({ progress, duration }: { progress: number; duration: number }) {
  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0
  return (
    <div className="w-full h-[2px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: '#c9a84c', width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 10, ease: 'linear' }}
      />
    </div>
  )
}

export function NowPlayingCard() {
  const [state, setState] = useState<NowPlayingState | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = async () => {
    try {
      const res = await fetch('/api/music/now-playing')
      if (!res.ok) return
      const data = await res.json() as NowPlayingState
      setState(data)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 12000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!state) return null
  if (!state.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
        style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 4,
          padding: '14px 16px',
        }}
      >
        <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          now playing —
        </p>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Connect Spotify to see what&apos;s playing
        </p>
        <Link
          href="/api/auth/spotify"
          className="inline-block text-[11px] px-3 py-1.5 text-center transition-all"
          style={{
            backgroundColor: '#1db954',
            color: '#fff',
            borderRadius: 2,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}
        >
          Connect Spotify
        </Link>
      </motion.div>
    )
  }

  if (!state.playing || !state.track) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
        style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 4,
          padding: '12px 14px',
        }}
      >
        <div style={{ width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, flexShrink: 0 }} />
        <div>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            now playing —
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            nothing playing
          </p>
        </div>
      </motion.div>
    )
  }

  const { track } = state

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={track.name}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div className="flex gap-3 p-3">
          {/* Album art */}
          {track.albumArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.albumArt}
              alt={track.album}
              style={{ width: 46, height: 46, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
              draggable={false}
            />
          ) : (
            <div style={{ width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, flexShrink: 0 }} />
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              now playing
            </p>
            <p
              className="text-sm leading-tight truncate"
              style={{ color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {track.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {track.artist}
            </p>
          </div>

          {/* Spotify link */}
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 self-center"
            title="Open in Spotify"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#1db954" fillOpacity="0.15" />
              <path
                d="M17.2 10.8c-3-1.8-8-1.9-10.8-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1C9 7.1 14.5 7.2 18 9.3c.4.2.5.7.3 1.1-.3.4-.7.6-1.1.4zm-.1 2.9c-.3.4-.8.5-1.2.3-2.5-1.5-6.3-2-9.2-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-.9 7.5-.5 10.4 1.3.4.3.5.8.5 1zm-1.3 2.8c-.2.3-.6.5-1 .3-2.2-1.3-5-1.6-8.2-.9-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 3.6-.8 6.7-.5 9.2 1 .3.3.4.6.3.9z"
                fill="#1db954"
              />
            </svg>
          </a>
        </div>

        {/* Progress bar */}
        <div className="px-3 pb-3">
          <ProgressBar progress={track.progress} duration={track.duration} />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compact inline version for chibi/lazy pages
export function NowPlayingInline() {
  const [state, setState] = useState<NowPlayingState | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = async () => {
    try {
      const res = await fetch('/api/music/now-playing')
      if (!res.ok) return
      const data = await res.json() as NowPlayingState
      setState(data)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 12000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!state?.playing || !state.track) return null

  const { track } = state

  return (
    <AnimatePresence>
      <motion.div
        key={track.name}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        className="flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(20,18,16,0.85)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 3,
          padding: '6px 10px',
          backdropFilter: 'blur(8px)',
        }}
      >
        {track.albumArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.albumArt} alt="" style={{ width: 24, height: 24, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} draggable={false} />
        )}
        <div className="min-w-0">
          <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {track.name}
          </p>
          <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {track.artist}
          </p>
        </div>
        {/* Equalizer animation */}
        <div className="flex items-end gap-[2px] shrink-0" style={{ height: 14 }}>
          {[0.4, 0.9, 0.6, 1.0, 0.7].map((h, i) => (
            <motion.div
              key={i}
              style={{ width: 2, backgroundColor: '#c9a84c', borderRadius: 1 }}
              animate={{ height: ['40%', `${h * 100}%`, '30%', `${h * 80}%`, '40%'] }}
              transition={{ repeat: Infinity, duration: 0.8 + i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Apple Music now-playing (client-side MusicKit JS polling) ────────────────

interface AppleTrack {
  name: string
  artist: string
  album: string
  artUrl: string | null
  progress: number
  duration: number
}

function getAppleArtUrl(url: string | undefined): string | null {
  if (!url) return null
  return url.replace('{w}', '80').replace('{h}', '80')
}

export function AppleMusicCard() {
  const [track, setTrack] = useState<AppleTrack | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = () => {
    const mk = getMusicKit()
    if (!mk) return
    setAuthorized(mk.isAuthorized)
    if (!mk.isAuthorized || !mk.nowPlayingItem) { setTrack(null); return }
    const item = mk.nowPlayingItem
    setTrack({
      name:     item.title ?? '',
      artist:   item.artistName ?? '',
      album:    item.albumName ?? '',
      artUrl:   getAppleArtUrl(item.artwork?.url),
      progress: (mk.currentPlaybackTime ?? 0) * 1000,
      duration: (item.playbackDuration ?? 0) * 1000,
    })
  }

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authorized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(252,60,68,0.15)',
          borderRadius: 4,
          padding: '14px 16px',
        }}
      >
        <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'rgba(252,60,68,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          apple music —
        </p>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Connect Apple Music to see what&apos;s playing
        </p>
        <Link
          href="/connect"
          className="inline-block text-[11px] px-3 py-1.5 transition-all"
          style={{ backgroundColor: '#fc3c44', color: '#fff', borderRadius: 2, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Connect in Settings
        </Link>
      </motion.div>
    )
  }

  if (!track) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={track.name}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        style={{
          backgroundColor: '#141210',
          border: '1px solid rgba(252,60,68,0.18)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div className="flex gap-3 p-3">
          {track.artUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.artUrl} alt={track.album} style={{ width: 46, height: 46, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} draggable={false} />
          ) : (
            <div style={{ width: 46, height: 46, backgroundColor: 'rgba(252,60,68,0.12)', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fc3c44', fontSize: '1.2rem' }}>♪</span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(252,60,68,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              apple music
            </p>
            <p className="text-sm leading-tight truncate" style={{ color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {track.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {track.artist}
            </p>
          </div>
        </div>
        <div className="px-3 pb-3">
          <ProgressBar progress={track.progress} duration={track.duration} />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
