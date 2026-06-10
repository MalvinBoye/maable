'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { motion } from 'framer-motion'

// Crops to the pixel region and downscales to maxPx on the longest side.
// This keeps file sizes sane for full-resolution phone photos.
export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  maxPx = 900,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
  })

  // Scale down to maxPx if the crop region is larger
  const scale  = Math.min(1, maxPx / Math.max(pixelCrop.width, pixelCrop.height))
  const outW   = Math.round(pixelCrop.width  * scale)
  const outH   = Math.round(pixelCrop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width  = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, outW, outH,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('crop failed')), 'image/webp', 0.92)
  })
}

interface Props {
  src: string
  aspect?: number
  onConfirm: (blob: Blob, url: string) => void
  onClose: () => void
}

export function ImageCropModal({ src, aspect, onConfirm, onClose }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, pix: Area) => {
    setCroppedAreaPixels(pix)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels)
      onConfirm(blob, URL.createObjectURL(blob))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(10,9,8,0.76)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        style={{
          background: '#1a1916', borderRadius: 20,
          width: '100%', maxWidth: 520,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.78)', margin: 0 }}>
            reframe
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', margin: '3px 0 0' }}>
            drag to pan · scroll or pinch to zoom
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', height: 400, background: '#0a0908' }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect ?? 1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{
              containerStyle: { borderRadius: 0 },
              mediaStyle: { transition: 'transform 0.12s ease' },
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.70)',
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
              },
            }}
          />
          {/* Corner handles */}
          {[
            { top: 0, left: 0,  borderTop: '2.5px solid #fff', borderLeft: '2.5px solid #fff' },
            { top: 0, right: 0, borderTop: '2.5px solid #fff', borderRight: '2.5px solid #fff' },
            { bottom: 0, left: 0,  borderBottom: '2.5px solid #fff', borderLeft: '2.5px solid #fff' },
            { bottom: 0, right: 0, borderBottom: '2.5px solid #fff', borderRight: '2.5px solid #fff' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, pointerEvents: 'none', zIndex: 3, ...s }} />
          ))}
        </div>

        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.65rem', color: 'rgba(255,255,255,0.30)', flexShrink: 0 }}>
            zoom
          </span>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#f5f0e8', height: 2 }}
          />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.30)', flexShrink: 0, minWidth: 28 }}>
            {zoom.toFixed(1)}×
          </span>
        </div>

        <div style={{ padding: '10px 20px 20px', display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10, fontSize: '0.78rem',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              color: 'rgba(255,255,255,0.38)',
              background: 'transparent', cursor: 'pointer',
            }}
          >
            cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            style={{
              flex: 2, padding: '10px',
              borderRadius: 10, fontSize: '0.78rem',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              background: processing ? 'rgba(255,255,255,0.10)' : '#f5f0e8',
              color: processing ? 'rgba(255,255,255,0.30)' : '#1a1916',
              border: 'none', cursor: processing ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {processing ? 'cropping…' : 'use this crop'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
