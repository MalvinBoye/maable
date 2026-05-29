'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Config types ─────────────────────────────────────────────────────────────

export type AvatarSkin      = 'cream' | 'peach' | 'tan' | 'brown' | 'dark'
export type AvatarHairStyle = 'bob' | 'long' | 'bun' | 'curly' | 'spiky' | 'wavy'
export type AvatarHairColor = 'black' | 'brown' | 'blonde' | 'red' | 'white' | 'blue'
export type AvatarEyes      = 'normal' | 'big' | 'sleepy' | 'sparkle'
export type AvatarPet       = 'none' | 'cat' | 'dog' | 'bunny'
export type AvatarAccessory = 'none' | 'glasses' | 'hat' | 'headband'

export interface AvatarConfig {
  skin:      AvatarSkin
  hair:      AvatarHairStyle
  hairColor: AvatarHairColor
  eyes:      AvatarEyes
  pet:       AvatarPet
  accessory: AvatarAccessory
}

export const DEFAULT_CONFIG: AvatarConfig = {
  skin: 'peach', hair: 'bob', hairColor: 'black',
  eyes: 'big', pet: 'none', accessory: 'none',
}

const STORAGE_KEY = 'maable-avatar-config'

export function loadAvatarConfig(): AvatarConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AvatarConfig) : null
  } catch { return null }
}

export function saveAvatarConfig(config: AvatarConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  window.dispatchEvent(new CustomEvent('maable-avatar-update', { detail: config }))
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const SKIN: Record<AvatarSkin, string> = {
  cream: '#fde8d0', peach: '#f5c5a3', tan: '#d4956a', brown: '#a0694a', dark: '#6b3d2e',
}
const SKIN_SHADE: Record<AvatarSkin, string> = {
  cream: '#edc5a0', peach: '#d4a07a', tan: '#b0714a', brown: '#7a4a2e', dark: '#4a2518',
}
const HAIR: Record<AvatarHairColor, string> = {
  black: '#1a1410', brown: '#5c3b1e', blonde: '#e0b84a', red: '#b83020', white: '#dedad4', blue: '#2563eb',
}

// ─── SVG avatar ───────────────────────────────────────────────────────────────
// viewBox 0 0 80 96  — face centred ~(40,46), pet zone bottom-right

export function AvatarSvg({ config, size = 80 }: { config: AvatarConfig; size?: number }) {
  const sc  = SKIN[config.skin]
  const scs = SKIN_SHADE[config.skin]
  const hc  = HAIR[config.hairColor]

  return (
    <svg
      viewBox="0 0 80 96"
      width={size} height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* ── Pet (drawn behind character for bunny/cat ears that peek) ── */}
      {config.pet !== 'none' && <PetBack pet={config.pet} />}

      {/* ── Hair back layer (behind face) ── */}
      <HairBack hair={config.hair} hc={hc} />

      {/* ── Face ── */}
      {/* Neck */}
      <rect x="34" y="69" width="12" height="8" rx="6" fill={sc} />
      {/* Body hint */}
      <ellipse cx="40" cy="84" rx="18" ry="10" fill={scs} />
      {/* Face oval */}
      <ellipse cx="40" cy="46" rx="23" ry="26" fill={sc} />
      {/* Ear left */}
      <ellipse cx="17" cy="48" rx="4" ry="5" fill={sc} />
      <ellipse cx="17" cy="48" rx="2.5" ry="3.5" fill={scs} />
      {/* Ear right */}
      <ellipse cx="63" cy="48" rx="4" ry="5" fill={sc} />
      <ellipse cx="63" cy="48" rx="2.5" ry="3.5" fill={scs} />

      {/* ── Hair front (cap / bangs) ── */}
      <HairFront hair={config.hair} hc={hc} />

      {/* ── Face details ── */}
      {/* Blush */}
      <ellipse cx="24" cy="53" rx="7" ry="5" fill="rgba(255,140,140,0.28)" />
      <ellipse cx="56" cy="53" rx="7" ry="5" fill="rgba(255,140,140,0.28)" />
      {/* Eyes */}
      <Eyes style={config.eyes} />
      {/* Mouth */}
      <path d="M 34 62 Q 40 67 46 62" stroke="rgba(100,60,40,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* ── Accessory ── */}
      {config.accessory !== 'none' && <Accessory acc={config.accessory} hc={hc} hair={config.hair} />}

      {/* ── Pet front ── */}
      {config.pet !== 'none' && <PetFront pet={config.pet} />}
    </svg>
  )
}

// ─── Hair back ────────────────────────────────────────────────────────────────

function HairBack({ hair, hc }: { hair: AvatarHairStyle; hc: string }) {
  switch (hair) {
    case 'bob':
      return <ellipse cx="40" cy="44" rx="25" ry="28" fill={hc} />
    case 'long':
      return <>
        <ellipse cx="40" cy="46" rx="25" ry="30" fill={hc} />
        <path d="M15,45 Q11,68 13,82 Q18,88 22,80 Q18,64 19,45Z" fill={hc} />
        <path d="M65,45 Q69,68 67,82 Q62,88 58,80 Q62,64 61,45Z" fill={hc} />
      </>
    case 'bun':
      return <>
        <ellipse cx="40" cy="47" rx="24" ry="27" fill={hc} />
        <circle cx="40" cy="12" r="11" fill={hc} />
      </>
    case 'curly':
      return <path d="M15,45 Q16,30 21,21 Q26,13 32,16 Q36,9 40,11 Q44,9 48,16 Q54,13 59,21 Q64,30 65,45 Q55,32 40,30 Q25,32 15,45Z" fill={hc} />
    case 'spiky':
      return <path d="M15,45 L20,26 L27,38 L33,17 L40,31 L47,17 L53,38 L60,26 L65,45 Q55,32 40,30 Q25,32 15,45Z" fill={hc} />
    case 'wavy':
      return <>
        <ellipse cx="40" cy="46" rx="26" ry="30" fill={hc} />
        <path d="M14,44 Q8,56 11,68 Q14,78 11,86 Q17,90 21,84 Q16,74 18,63 Q22,51 16,44Z" fill={hc} />
        <path d="M66,44 Q72,56 69,68 Q66,78 69,86 Q63,90 59,84 Q64,74 62,63 Q58,51 64,44Z" fill={hc} />
      </>
  }
}

// ─── Hair front (cap / bangs) ─────────────────────────────────────────────────

function HairFront({ hair, hc }: { hair: AvatarHairStyle; hc: string }) {
  switch (hair) {
    case 'bob':
      return <path d="M17,46 Q17,15 40,13 Q63,15 63,46 Q53,32 40,30 Q27,32 17,46Z" fill={hc} />
    case 'long':
      return <path d="M17,46 Q17,15 40,13 Q63,15 63,46 Q53,32 40,30 Q27,32 17,46Z" fill={hc} />
    case 'bun':
      return <path d="M18,50 Q18,23 40,21 Q62,23 62,50 Q52,37 40,35 Q28,37 18,50Z" fill={hc} />
    case 'curly':
      return <path d="M15,45 Q16,30 21,21 Q26,13 32,16 Q36,9 40,11 Q44,9 48,16 Q54,13 59,21 Q64,30 65,45 Q55,32 40,30 Q25,32 15,45Z" fill={hc} />
    case 'spiky':
      return <path d="M15,45 L20,26 L27,38 L33,17 L40,31 L47,17 L53,38 L60,26 L65,45 Q55,32 40,30 Q25,32 15,45Z" fill={hc} />
    case 'wavy':
      return <path d="M17,48 Q17,20 40,18 Q63,20 63,48 Q53,35 40,33 Q27,35 17,48Z" fill={hc} />
  }
}

// ─── Eyes ─────────────────────────────────────────────────────────────────────

function Eyes({ style }: { style: AvatarEyes }) {
  const dark = '#1a1410'
  switch (style) {
    case 'normal':
      return <>
        <ellipse cx="29" cy="45" rx="5" ry="6" fill={dark} />
        <circle cx="31" cy="43" r="1.5" fill="white" />
        <ellipse cx="51" cy="45" rx="5" ry="6" fill={dark} />
        <circle cx="53" cy="43" r="1.5" fill="white" />
      </>
    case 'big':
      return <>
        <ellipse cx="29" cy="45" rx="7" ry="8" fill={dark} />
        <circle cx="31.5" cy="42" r="2.5" fill="white" />
        <circle cx="28" cy="47" r="1" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="51" cy="45" rx="7" ry="8" fill={dark} />
        <circle cx="53.5" cy="42" r="2.5" fill="white" />
        <circle cx="50" cy="47" r="1" fill="rgba(255,255,255,0.5)" />
      </>
    case 'sleepy':
      return <>
        <path d="M23,46 Q29,54 35,46 Q29,43 23,46Z" fill={dark} />
        <path d="M45,46 Q51,54 57,46 Q51,43 45,46Z" fill={dark} />
      </>
    case 'sparkle':
      return <>
        <circle cx="29" cy="45" r="7" fill={dark} />
        <circle cx="29" cy="45" r="4" fill="#3b82f6" />
        <circle cx="31" cy="42" r="2.5" fill="white" />
        <circle cx="27" cy="48" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="51" cy="45" r="7" fill={dark} />
        <circle cx="51" cy="45" r="4" fill="#3b82f6" />
        <circle cx="53" cy="42" r="2.5" fill="white" />
        <circle cx="49" cy="48" r="1" fill="rgba(255,255,255,0.6)" />
      </>
  }
}

// ─── Accessories ──────────────────────────────────────────────────────────────

function Accessory({ acc, hc, hair }: { acc: AvatarAccessory; hc: string; hair: AvatarHairStyle }) {
  switch (acc) {
    case 'glasses':
      return <>
        <circle cx="29" cy="46" r="8" fill="none" stroke="#78716c" strokeWidth="2" />
        <circle cx="51" cy="46" r="8" fill="none" stroke="#78716c" strokeWidth="2" />
        <line x1="37" y1="46" x2="43" y2="46" stroke="#78716c" strokeWidth="2" />
        <line x1="21" y1="44" x2="18" y2="42" stroke="#78716c" strokeWidth="1.5" />
        <line x1="59" y1="44" x2="62" y2="42" stroke="#78716c" strokeWidth="1.5" />
      </>
    case 'hat': {
      const brimY = hair === 'bun' ? 18 : 22
      return <>
        <rect x="21" y={brimY - 14} width="38" height="16" rx="3" fill="#1a1410" />
        <rect x="13" y={brimY} width="54" height="5" rx="2.5" fill="#1a1410" />
        <rect x="23" y={brimY - 13} width="34" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      </>
    }
    case 'headband': {
      const y = hair === 'bun' ? 28 : 24
      return <>
        <path d={`M18,${y} Q40,${y - 10} 62,${y}`} stroke={hc === '#1a1410' ? '#c9a84c' : hc} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d={`M18,${y} Q40,${y - 10} 62,${y}`} stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    }
    default: return null
  }
}

// ─── Pets ─────────────────────────────────────────────────────────────────────

function PetBack({ pet }: { pet: AvatarPet }) {
  if (pet === 'bunny') {
    return <>
      <ellipse cx="64" cy="70" rx="5" ry="10" fill="#e8e0d8" />
      <ellipse cx="72" cy="70" rx="5" ry="10" fill="#e8e0d8" />
      <ellipse cx="64" cy="70" rx="3" ry="7" fill="rgba(255,181,192,0.65)" />
      <ellipse cx="72" cy="70" rx="3" ry="7" fill="rgba(255,181,192,0.65)" />
    </>
  }
  if (pet === 'cat') {
    return <>
      <polygon points="57,76 60,68 63,76" fill="#d4a843" />
      <polygon points="66,76 69,68 72,76" fill="#d4a843" />
      <polygon points="57,76 60,69 63,76" fill="rgba(255,181,192,0.7)" />
      <polygon points="66,76 69,69 72,76" fill="rgba(255,181,192,0.7)" />
    </>
  }
  return null
}

function PetFront({ pet }: { pet: AvatarPet }) {
  switch (pet) {
    case 'cat':
      return <>
        <ellipse cx="65" cy="80" rx="11" ry="10" fill="#d4a843" />
        <ellipse cx="65" cy="79" rx="8" ry="7" fill="#e8c070" />
        <circle cx="61" cy="78" r="2.5" fill="#1a1410" />
        <circle cx="69" cy="78" r="2.5" fill="#1a1410" />
        <circle cx="62" cy="77" r="1" fill="white" />
        <circle cx="70" cy="77" r="1" fill="white" />
        <ellipse cx="65" cy="82" rx="2" ry="1.5" fill="rgba(200,80,80,0.7)" />
        <line x1="59" y1="82" x2="54" y2="81" stroke="rgba(100,60,20,0.5)" strokeWidth="1" />
        <line x1="59" y1="83" x2="54" y2="84" stroke="rgba(100,60,20,0.5)" strokeWidth="1" />
        <line x1="71" y1="82" x2="76" y2="81" stroke="rgba(100,60,20,0.5)" strokeWidth="1" />
        <line x1="71" y1="83" x2="76" y2="84" stroke="rgba(100,60,20,0.5)" strokeWidth="1" />
      </>
    case 'dog':
      return <>
        <ellipse cx="57" cy="82" rx="6" ry="8" fill="#a07050" />
        <ellipse cx="73" cy="82" rx="6" ry="8" fill="#a07050" />
        <ellipse cx="65" cy="79" rx="11" ry="10" fill="#c9a07a" />
        <ellipse cx="65" cy="82" rx="7" ry="5" fill="#d8b898" />
        <circle cx="61" cy="77" r="2.5" fill="#1a1410" />
        <circle cx="69" cy="77" r="2.5" fill="#1a1410" />
        <circle cx="62" cy="76" r="1" fill="white" />
        <circle cx="70" cy="76" r="1" fill="white" />
        <ellipse cx="65" cy="83" rx="3.5" ry="2.5" fill="#a04030" />
      </>
    case 'bunny':
      return <>
        <ellipse cx="65" cy="80" rx="10" ry="10" fill="#e8e0d8" />
        <ellipse cx="65" cy="80" rx="7" ry="7" fill="#f0e8e0" />
        <circle cx="61" cy="79" r="2.5" fill="#1a1410" />
        <circle cx="69" cy="79" r="2.5" fill="#1a1410" />
        <circle cx="62" cy="78" r="1" fill="white" />
        <circle cx="70" cy="78" r="1" fill="white" />
        <ellipse cx="65" cy="83" rx="2" ry="1.5" fill="rgba(255,181,192,0.9)" />
      </>
    default: return null
  }
}

// ─── Avatar Display (SVG or image fallback) ───────────────────────────────────

export function AvatarDisplay({
  avatarUrl,
  size = 48,
  className,
}: {
  avatarUrl: string | null | undefined
  size?: number
  className?: string
}) {
  const [config, setConfig] = useState<AvatarConfig | null>(null)

  useEffect(() => {
    setConfig(loadAvatarConfig())

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<AvatarConfig>).detail
      setConfig(detail ?? loadAvatarConfig())
    }
    window.addEventListener('maable-avatar-update', handleUpdate)
    return () => window.removeEventListener('maable-avatar-update', handleUpdate)
  }, [])

  if (config) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <AvatarSvg config={config} size={size} />
      </div>
    )
  }

  const src = avatarUrl
    ? (avatarUrl.startsWith('/') || avatarUrl.startsWith('http') ? avatarUrl : `/illustrations/${avatarUrl}.png`)
    : '/illustrations/avatar-user.png'

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="avatar"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ objectFit: 'contain', flexShrink: 0 }}
    />
  )
}

// ─── Customizer modal ─────────────────────────────────────────────────────────

type Tab = 'skin' | 'hair' | 'eyes' | 'pet' | 'accessory'

const TABS: { id: Tab; label: string }[] = [
  { id: 'skin',      label: 'Skin'      },
  { id: 'hair',      label: 'Hair'      },
  { id: 'eyes',      label: 'Eyes'      },
  { id: 'pet',       label: 'Pet'       },
  { id: 'accessory', label: 'Extras'    },
]

const SKIN_OPTIONS: { id: AvatarSkin; color: string; label: string }[] = [
  { id: 'cream',  color: '#fde8d0', label: 'Cream'  },
  { id: 'peach',  color: '#f5c5a3', label: 'Peach'  },
  { id: 'tan',    color: '#d4956a', label: 'Tan'    },
  { id: 'brown',  color: '#a0694a', label: 'Brown'  },
  { id: 'dark',   color: '#6b3d2e', label: 'Dark'   },
]

const HAIR_STYLES: { id: AvatarHairStyle; label: string }[] = [
  { id: 'bob',   label: 'Bob'   },
  { id: 'long',  label: 'Long'  },
  { id: 'bun',   label: 'Bun'   },
  { id: 'curly', label: 'Curly' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'wavy',  label: 'Wavy'  },
]

const HAIR_COLORS: { id: AvatarHairColor; color: string; label: string }[] = [
  { id: 'black',  color: '#1a1410', label: 'Black'  },
  { id: 'brown',  color: '#5c3b1e', label: 'Brown'  },
  { id: 'blonde', color: '#e0b84a', label: 'Blonde' },
  { id: 'red',    color: '#b83020', label: 'Red'    },
  { id: 'white',  color: '#dedad4', label: 'White'  },
  { id: 'blue',   color: '#2563eb', label: 'Blue'   },
]

const EYE_OPTIONS: { id: AvatarEyes; label: string; desc: string }[] = [
  { id: 'normal',  label: 'Normal',  desc: 'Classic round' },
  { id: 'big',     label: 'Big',     desc: 'Wide & expressive' },
  { id: 'sleepy',  label: 'Sleepy',  desc: 'Half-lidded' },
  { id: 'sparkle', label: 'Sparkle', desc: 'Galaxy eyes' },
]

const PET_OPTIONS: { id: AvatarPet; label: string; desc: string }[] = [
  { id: 'none',   label: 'None',   desc: 'Solo' },
  { id: 'cat',    label: 'Cat',    desc: 'Fluffy companion' },
  { id: 'dog',    label: 'Dog',    desc: 'Loyal friend' },
  { id: 'bunny',  label: 'Bunny',  desc: 'Soft ears' },
]

const ACCESSORY_OPTIONS: { id: AvatarAccessory; label: string; desc: string }[] = [
  { id: 'none',     label: 'None',     desc: 'Clean look' },
  { id: 'glasses',  label: 'Glasses',  desc: 'Scholarly vibes' },
  { id: 'hat',      label: 'Hat',      desc: 'Cap it off' },
  { id: 'headband', label: 'Headband', desc: 'Hair back' },
]

export function AvatarCustomizerModal({
  onSave,
  onClose,
}: {
  onSave: (config: AvatarConfig) => void
  onClose: () => void
}) {
  const [config, setConfig] = useState<AvatarConfig>(() => loadAvatarConfig() ?? DEFAULT_CONFIG)
  const [tab, setTab]       = useState<Tab>('skin')

  const set = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: val }))

  const chip = (active: boolean) => ({
    padding: '5px 12px', fontSize: 11, cursor: 'pointer',
    fontFamily: 'Georgia, serif', fontStyle: 'italic' as const,
    border: `1px solid ${active ? 'rgba(201,168,76,0.60)' : 'rgba(255,255,255,0.10)'}`,
    color: active ? '#c9a84c' : 'rgba(255,255,255,0.45)',
    backgroundColor: active ? 'rgba(201,168,76,0.10)' : 'transparent',
    borderRadius: 4, transition: 'all 0.12s',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        style={{
          width: 500, backgroundColor: '#0d0c0a',
          border: '1px solid rgba(201,168,76,0.20)',
          borderRadius: 12,
          boxShadow: '0 48px 120px rgba(0,0,0,0.80)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', fontFamily: 'Georgia, serif' }}>
            Build your character
          </p>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.25)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div className="flex gap-0" style={{ minHeight: 320 }}>
          {/* Preview */}
          <div className="flex flex-col items-center justify-center" style={{ width: 160, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 0', flexShrink: 0 }}>
            <motion.div
              key={JSON.stringify(config)}
              initial={{ scale: 0.92 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            >
              <AvatarSvg config={config} size={110} />
            </motion.div>
          </div>

          {/* Options */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 10,
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    letterSpacing: '0.05em',
                    color: tab === t.id ? '#c9a84c' : 'rgba(255,255,255,0.28)',
                    borderBottom: `2px solid ${tab === t.id ? '#c9a84c' : 'transparent'}`,
                    backgroundColor: 'transparent', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >

                  {tab === 'skin' && (
                    <div className="flex flex-col gap-3">
                      <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif' }}>Skin tone</p>
                      <div className="flex gap-2 flex-wrap">
                        {SKIN_OPTIONS.map(s => (
                          <button
                            key={s.id}
                            onClick={() => set('skin', s.id)}
                            title={s.label}
                            style={{
                              width: 36, height: 36, borderRadius: '50%',
                              backgroundColor: s.color, cursor: 'pointer',
                              outline: config.skin === s.id ? `3px solid #c9a84c` : '3px solid transparent',
                              outlineOffset: 2, transition: 'outline 0.12s',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'hair' && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif', marginBottom: 8 }}>Style</p>
                        <div className="flex gap-2 flex-wrap">
                          {HAIR_STYLES.map(h => (
                            <button key={h.id} onClick={() => set('hair', h.id)} style={chip(config.hair === h.id)}>
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif', marginBottom: 8 }}>Colour</p>
                        <div className="flex gap-2 flex-wrap">
                          {HAIR_COLORS.map(c => (
                            <button
                              key={c.id}
                              onClick={() => set('hairColor', c.id)}
                              title={c.label}
                              style={{
                                width: 28, height: 28, borderRadius: '50%',
                                backgroundColor: c.color, cursor: 'pointer',
                                border: c.id === 'white' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                outline: config.hairColor === c.id ? `3px solid #c9a84c` : '3px solid transparent',
                                outlineOffset: 2, transition: 'outline 0.12s',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'eyes' && (
                    <div className="flex flex-col gap-2">
                      <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>Eye style</p>
                      {EYE_OPTIONS.map(e => (
                        <button
                          key={e.id}
                          onClick={() => set('eyes', e.id)}
                          className="flex items-center gap-3 text-left px-3 py-2.5 transition-all"
                          style={{
                            backgroundColor: config.eyes === e.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            border: `1px solid ${config.eyes === e.id ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: config.eyes === e.id ? '#c9a84c' : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                          }} />
                          <div>
                            <p style={{ fontSize: 12, color: config.eyes === e.id ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{e.label}</p>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif' }}>{e.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {tab === 'pet' && (
                    <div className="flex flex-col gap-2">
                      <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>Companion</p>
                      {PET_OPTIONS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => set('pet', p.id)}
                          className="flex items-center gap-3 text-left px-3 py-2.5 transition-all"
                          style={{
                            backgroundColor: config.pet === p.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            border: `1px solid ${config.pet === p.id ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: config.pet === p.id ? '#c9a84c' : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                          }} />
                          <div>
                            <p style={{ fontSize: 12, color: config.pet === p.id ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{p.label}</p>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif' }}>{p.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {tab === 'accessory' && (
                    <div className="flex flex-col gap-2">
                      <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>Accessory</p>
                      {ACCESSORY_OPTIONS.map(a => (
                        <button
                          key={a.id}
                          onClick={() => set('accessory', a.id)}
                          className="flex items-center gap-3 text-left px-3 py-2.5 transition-all"
                          style={{
                            backgroundColor: config.accessory === a.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            border: `1px solid ${config.accessory === a.id ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: config.accessory === a.id ? '#c9a84c' : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                          }} />
                          <div>
                            <p style={{ fontSize: 12, color: config.accessory === a.id ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{a.label}</p>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'Georgia, serif' }}>{a.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { saveAvatarConfig(config); onSave(config) }}
            className="flex-1 py-2.5 text-sm transition-all"
            style={{ backgroundColor: '#c9a84c', color: '#0a0908', fontFamily: 'Georgia, serif', fontStyle: 'italic', borderRadius: 6 }}
          >
            Save character
          </button>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); onSave(DEFAULT_CONFIG); onClose() }}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            reset
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
