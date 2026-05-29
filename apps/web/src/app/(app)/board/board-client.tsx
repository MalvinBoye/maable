'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { BoardItemData } from './actions'
import {
  createBoardItem, updateBoardItem, deleteBoardItem,
} from './actions'

// ─── Note colour palette ──────────────────────────────────────────────────────

const NOTE_COLORS = [
  '#fdf9f0', // cream (default)
  '#f5f0e8', // warm parchment
  '#e8f0ee', // sage mist
  '#f0e8f0', // soft lavender
  '#f0ece0', // sand
  '#e8edf5', // sky
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a) }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

// ─── Pushpin SVG ─────────────────────────────────────────────────────────────

function Pushpin({ color = '#c9a84c' }: { color?: string }) {
  return (
    <svg width="18" height="28" viewBox="0 0 18 28" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
      <circle cx="9" cy="8" r="7" fill={color} />
      <circle cx="9" cy="8" r="3.5" fill="rgba(255,255,255,0.35)" />
      <line x1="9" y1="15" x2="9" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Photo item ───────────────────────────────────────────────────────────────

function PhotoPin({
  item, onDragEnd, onDelete, onBringForward,
}: {
  item: BoardItemData
  onDragEnd: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
  onBringForward: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(item.caption ?? '')
  const dragStart = useRef<{ mx: number; my: number; ix: number; iy: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y }
    onBringForward(item.id)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    onDragEnd(item.id, dragStart.current.ix + dx, dragStart.current.iy + dy)
  }

  const onPointerUp = () => { dragStart.current = null }

  const saveCaption = async () => {
    setEditing(false)
    await updateBoardItem(item.id, { caption: caption.trim() || null })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        zIndex: item.z_order + 10,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center top',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pushpin */}
      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <Pushpin />
      </div>

      {/* Photo card */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '10px 10px 32px',
          boxShadow: hovered
            ? '0 12px 40px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)'
            : '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 2,
          transition: 'box-shadow 0.2s',
        }}
      >
        {item.content && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.content}
            alt={caption}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            draggable={false}
          />
        )}

        {/* Caption area */}
        <div style={{ position: 'absolute', bottom: 6, left: 10, right: 10, textAlign: 'center' }}>
          {editing ? (
            <input
              autoFocus
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onBlur={saveCaption}
              onKeyDown={e => { if (e.key === 'Enter') saveCaption() }}
              onPointerDown={e => e.stopPropagation()}
              maxLength={60}
              style={{
                width: '100%', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.65rem', color: 'rgba(26,25,22,0.60)', backgroundColor: 'transparent',
                outline: 'none', textAlign: 'center', borderBottom: '1px solid rgba(26,25,22,0.20)',
              }}
            />
          ) : (
            <p
              onClick={() => setEditing(true)}
              style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '0.65rem', color: 'rgba(26,25,22,0.45)',
                cursor: 'text', minHeight: 14,
              }}
            >
              {caption || (hovered ? 'add caption…' : '')}
            </p>
          )}
        </div>
      </div>

      {/* Delete */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onDelete(item.id)}
            style={{
              position: 'absolute', top: -8, right: -8,
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: 'rgba(26,25,22,0.75)',
              color: '#fff', fontSize: '0.7rem', zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: 'none',
            }}
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Note item ────────────────────────────────────────────────────────────────

function NotePin({
  item, onDragEnd, onDelete, onBringForward, onContentSave,
}: {
  item: BoardItemData
  onDragEnd: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
  onBringForward: (id: string) => void
  onContentSave: (id: string, content: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(item.content ?? '')
  const dragStart = useRef<{ mx: number; my: number; ix: number; iy: number } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y }
    onBringForward(item.id)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    onDragEnd(item.id, dragStart.current.ix + dx, dragStart.current.iy + dy)
  }

  const onPointerUp = () => { dragStart.current = null }

  const handleTextChange = (val: string) => {
    setText(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onContentSave(item.id, val), 1000)
  }

  const pinColors = ['#c9a84c', '#87837a', '#b45252', '#4a7c59']
  const pinColor = pinColors[Math.abs(item.id.charCodeAt(0)) % pinColors.length]!

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: item.rotation }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      style={{
        position: 'absolute', left: item.x, top: item.y,
        width: item.width, minHeight: item.width * 0.9,
        zIndex: focused ? 200 : item.z_order + 10,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center top',
        cursor: 'grab', userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pushpin */}
      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <Pushpin color={pinColor} />
      </div>

      {/* Note card */}
      <div
        style={{
          backgroundColor: item.color,
          padding: '24px 14px 14px',
          boxShadow: focused || hovered
            ? '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)'
            : '0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)',
          borderRadius: 2,
          transition: 'box-shadow 0.2s',
        }}
      >
        <textarea
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onFocus={() => { setFocused(true); onBringForward(item.id) }}
          onBlur={() => setFocused(false)}
          onPointerDown={e => e.stopPropagation()}
          placeholder="write anything…"
          style={{
            width: '100%', minHeight: 80, resize: 'none', outline: 'none',
            backgroundColor: 'transparent', border: 'none',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '0.82rem', lineHeight: 1.7,
            color: 'rgba(26,25,22,0.72)',
            caretColor: 'rgba(26,25,22,0.55)',
          }}
        />

        {/* Ruled lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent calc(1.7rem - 1px), rgba(26,25,22,0.06) calc(1.7rem - 1px), rgba(26,25,22,0.06) 1.7rem)',
          backgroundSize: '100% 1.7rem',
          backgroundPositionY: '24px',
          borderRadius: 2,
        }} />
      </div>

      {/* Delete */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onDelete(item.id)}
            style={{
              position: 'absolute', top: -8, right: -8,
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: 'rgba(26,25,22,0.70)', color: '#fff',
              fontSize: '0.7rem', zIndex: 30, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none',
            }}
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── BoardClient ──────────────────────────────────────────────────────────────

export function BoardClient({ userId, initialItems }: { userId: string; initialItems: BoardItemData[] }) {
  const [items, setItems] = useState<BoardItemData[]>(initialItems)
  const [uploading, setUploading] = useState(false)
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]!)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const maxZ = useRef(Math.max(0, ...initialItems.map(i => i.z_order)))
  const boardRef = useRef<HTMLDivElement>(null)

  const getCenter = useCallback(() => {
    const el = boardRef.current
    if (!el) return { x: 300, y: 200 }
    const rect = el.getBoundingClientRect()
    return {
      x: Math.random() * (rect.width - 280) + 60,
      y: Math.random() * (rect.height - 280) + 60,
    }
  }, [])

  // ── Item updates ────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, x, y } : i))
    updateBoardItem(id, { x, y }).catch(console.error)
  }, [])

  const handleBringForward = useCallback((id: string) => {
    maxZ.current += 1
    const z = maxZ.current
    setItems(prev => prev.map(i => i.id === id ? { ...i, z_order: z } : i))
    updateBoardItem(id, { z_order: z }).catch(console.error)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    deleteBoardItem(id).catch(console.error)
  }, [])

  const handleContentSave = useCallback((id: string, content: string) => {
    updateBoardItem(id, { content }).catch(console.error)
  }, [])

  // ── Add note ────────────────────────────────────────────────────────────────

  const addNote = async () => {
    const { x, y } = getCenter()
    const rotation = randomBetween(-4, 4)
    maxZ.current += 1
    const newItem: BoardItemData = {
      id: `temp-${Date.now()}`,
      type: 'note',
      content: '',
      caption: null,
      x, y, rotation, width: 200,
      color: noteColor,
      z_order: maxZ.current,
      created_at: new Date().toISOString(),
    }
    setItems(prev => [...prev, newItem])

    const result = await createBoardItem({ type: 'note', content: '', caption: null, x, y, rotation, width: 200, color: noteColor, z_order: maxZ.current })
    if (result.id) {
      setItems(prev => prev.map(i => i.id === newItem.id ? { ...i, id: result.id! } : i))
    }
  }

  // ── Add photo ───────────────────────────────────────────────────────────────

  const handlePhotoFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) { alert('Image must be under 8 MB'); return }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from('pins').upload(`board/${path}`, file, { contentType: file.type })
      if (upErr) { console.error(upErr); return }

      const { data: { publicUrl } } = supabase.storage.from('pins').getPublicUrl(`board/${path}`)
      const { x, y } = getCenter()
      const rotation = randomBetween(-5, 5)
      maxZ.current += 1

      // Show optimistically immediately
      const tempId = `temp-photo-${Date.now()}`
      const optimisticItem: BoardItemData = {
        id: tempId, type: 'photo', content: publicUrl, caption: null,
        x, y, rotation, width: 220, color: '#fff', z_order: maxZ.current,
        created_at: new Date().toISOString(),
      }
      setItems(prev => [...prev, optimisticItem])

      const result = await createBoardItem({
        type: 'photo', content: publicUrl, caption: null,
        x, y, rotation, width: 220, color: '#fff', z_order: maxZ.current,
      })
      if (result.id) {
        setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: result.id! } : i))
      }
    } finally { setUploading(false) }
  }, [userId, getCenter])

  // Double-click on board to add note
  const handleBoardDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement) !== boardRef.current) return
    const rect = boardRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left - 100
    const y = e.clientY - rect.top - 50
    const rotation = randomBetween(-4, 4)
    maxZ.current += 1
    const newItem: BoardItemData = {
      id: `temp-${Date.now()}`,
      type: 'note', content: '', caption: null,
      x: clamp(x, 0, rect.width - 220),
      y: clamp(y, 0, rect.height - 220),
      rotation, width: 200, color: noteColor, z_order: maxZ.current,
      created_at: new Date().toISOString(),
    }
    setItems(prev => [...prev, newItem])
    createBoardItem({ type: 'note', content: '', caption: null, x: newItem.x, y: newItem.y, rotation, width: 200, color: noteColor, z_order: maxZ.current })
      .then(result => {
        if (result.id) setItems(prev => prev.map(i => i.id === newItem.id ? { ...i, id: result.id! } : i))
      })
  }, [noteColor])

  // Board drop zone
  const handleBoardDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handlePhotoFile(file)
  }, [handlePhotoFile])

  // Board background — warm linen paper with dot-grid (matches architect mode feel)
  const boardBg = `
    radial-gradient(circle at 22% 28%, rgba(201,168,76,0.04) 0%, transparent 45%),
    radial-gradient(circle at 78% 68%, rgba(87,83,78,0.05) 0%, transparent 45%),
    radial-gradient(rgba(26,25,22,0.10) 1px, transparent 1px)
  `
  const boardBgSize = '28px 28px'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 4.5rem)' }}>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ backgroundColor: '#faf9f7', borderBottom: '1px solid rgba(26,25,22,0.09)', zIndex: 10 }}
      >
        <div>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(26,25,22,0.75)' }}>
            Board
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.68rem', color: 'rgba(26,25,22,0.35)' }}>
            double-click to add a note · drag photos in
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Note colour picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{ backgroundColor: '#f0ede8', border: '1px solid rgba(26,25,22,0.09)' }}
              title="Note colour"
            >
              <div style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: noteColor, border: '1px solid rgba(26,25,22,0.15)' }} />
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.55)' }}>colour</span>
            </button>
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full left-0 mt-2 p-2 flex gap-2 rounded-lg z-50"
                  style={{ backgroundColor: '#fff', border: '1px solid rgba(26,25,22,0.10)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                >
                  {NOTE_COLORS.map(c => (
                    <button key={c} onClick={() => { setNoteColor(c); setShowColorPicker(false) }}
                      style={{
                        width: 24, height: 24, borderRadius: 3, backgroundColor: c,
                        border: c === noteColor ? '2px solid rgba(26,25,22,0.55)' : '1px solid rgba(26,25,22,0.15)',
                        cursor: 'pointer',
                      }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add note */}
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: '#f0ede8', border: '1px solid rgba(26,25,22,0.09)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e8e4de' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0ede8' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'rgba(26,25,22,0.50)' }}>✎</span>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(26,25,22,0.60)' }}>note</span>
          </button>

          {/* Add photo */}
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#f0ede8', border: '1px solid rgba(26,25,22,0.09)',
              opacity: uploading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.backgroundColor = '#e8e4de' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0ede8' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'rgba(26,25,22,0.50)' }}>◑</span>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(26,25,22,0.60)' }}>
              {uploading ? 'uploading…' : 'photo'}
            </span>
          </button>

          <input
            ref={photoInputRef}
            type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = '' }}
          />

          {/* Item count */}
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.68rem', color: 'rgba(26,25,22,0.25)' }}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={boardRef}
        className="relative flex-1 overflow-hidden"
        style={{ background: boardBg, backgroundSize: boardBgSize, backgroundColor: '#ede8e0' }}
        onDoubleClick={handleBoardDoubleClick}
        onDragOver={e => e.preventDefault()}
        onDrop={handleBoardDrop}
      >
        {/* Empty hint */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(26,25,22,0.28)', marginBottom: 6 }}>
                your board is empty
              </p>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(26,25,22,0.18)' }}>
                double-click anywhere to pin a note · drag a photo to add it
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {items.map(item =>
            item.type === 'photo' ? (
              <PhotoPin
                key={item.id}
                item={item}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
                onBringForward={handleBringForward}
              />
            ) : (
              <NotePin
                key={item.id}
                item={item}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
                onBringForward={handleBringForward}
                onContentSave={handleContentSave}
              />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
