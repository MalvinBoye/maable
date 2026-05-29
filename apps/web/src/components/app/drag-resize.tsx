'use client'

import { useCallback, useRef, useState } from 'react'

export interface CardBounds {
  x: number
  y: number
  w: number
  h: number
}

type HandleDir = 'nw' | 'ne' | 'sw' | 'se'

interface DragResizeCardProps {
  id: string
  bounds: CardBounds
  minW?: number
  minH?: number
  onBoundsChange: (id: string, bounds: CardBounds) => void
  children: React.ReactNode
}

const HANDLE = 9

const HANDLE_POS: Record<HandleDir, React.CSSProperties> = {
  nw: { top: -HANDLE / 2, left:  -HANDLE / 2 },
  ne: { top: -HANDLE / 2, right: -HANDLE / 2 },
  sw: { bottom: -HANDLE / 2, left:  -HANDLE / 2 },
  se: { bottom: -HANDLE / 2, right: -HANDLE / 2 },
}

const HANDLE_CURSOR: Record<HandleDir, string> = {
  nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
}

export function DragResizeCard({
  id, bounds, minW = 140, minH = 100,
  onBoundsChange, children,
}: DragResizeCardProps) {
  const interRef = useRef<{
    type: 'drag' | 'resize'
    handle?: HandleDir
    startX: number
    startY: number
    startB: CardBounds
  } | null>(null)
  const [lifted, setLifted] = useState(false)

  const onDragDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setLifted(true)
    interRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, startB: { ...bounds } }
  }, [bounds])

  const onResizeDown = useCallback((dir: HandleDir) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setLifted(true)
    interRef.current = { type: 'resize', handle: dir, startX: e.clientX, startY: e.clientY, startB: { ...bounds } }
  }, [bounds])

  const onMove = useCallback((e: React.PointerEvent) => {
    const ia = interRef.current
    if (!ia) return
    const dx = e.clientX - ia.startX
    const dy = e.clientY - ia.startY
    const sb = ia.startB

    if (ia.type === 'drag') {
      onBoundsChange(id, { ...sb, x: sb.x + dx, y: sb.y + dy })
      return
    }

    const dir = ia.handle!
    let { x, y, w, h } = sb

    if (dir === 'nw') { x = sb.x + dx; y = sb.y + dy; w = sb.w - dx; h = sb.h - dy }
    else if (dir === 'ne') { y = sb.y + dy; w = sb.w + dx; h = sb.h - dy }
    else if (dir === 'sw') { x = sb.x + dx; w = sb.w - dx; h = sb.h + dy }
    else { w = sb.w + dx; h = sb.h + dy }

    onBoundsChange(id, {
      x: dir.includes('w') ? x : sb.x,
      y: dir.includes('n') ? y : sb.y,
      w: Math.max(w, minW),
      h: Math.max(h, minH),
    })
  }, [id, minW, minH, onBoundsChange])

  const onUp = useCallback(() => {
    interRef.current = null
    setLifted(false)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        zIndex: lifted ? 100 : 1,
        userSelect: 'none',
      }}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* Card content fills the full box */}
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        {children}
      </div>

      {/* Dashed architect border */}
      <div
        style={{
          position: 'absolute', inset: 0,
          border: '1px dashed rgba(26,25,22,0.18)',
          pointerEvents: 'none',
          borderRadius: 2,
        }}
      />

      {/* Drag grip — top edge, 32px wide strip */}
      <div
        title="Drag to move"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 22,
          cursor: lifted ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 6,
          zIndex: 10,
        }}
        onPointerDown={onDragDown}
      >
        <span
          style={{
            fontSize: 10,
            color: 'rgba(26,25,22,0.30)',
            letterSpacing: 2,
            pointerEvents: 'none',
            fontFamily: 'Georgia, serif',
          }}
        >
          ···
        </span>
      </div>

      {/* Resize handles — 4 corners */}
      {(['nw', 'ne', 'sw', 'se'] as HandleDir[]).map(dir => (
        <div
          key={dir}
          title={`Resize (${dir})`}
          style={{
            position: 'absolute',
            width: HANDLE,
            height: HANDLE,
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(26,25,22,0.32)',
            cursor: HANDLE_CURSOR[dir],
            zIndex: 20,
            ...HANDLE_POS[dir],
          }}
          onPointerDown={onResizeDown(dir)}
        />
      ))}
    </div>
  )
}
