'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@maable/core'

// ─── Profile type ─────────────────────────────────────────────────────────────

interface LazyProfile {
  display_name: string
  username: string
  avatar_url: string | null
  level: number
  total_xp: number
}

// ─── City data ────────────────────────────────────────────────────────────────

const CITIES = [
  { id: 'nyc',  name: 'New York',       country: 'USA',          lat: 40.7128,  lng: -74.006,  fact: 'NYC has more library books than any city in the world.' },
  { id: 'lon',  name: 'London',         country: 'UK',           lat: 51.5074,  lng: -0.1278,  fact: 'The London Underground opened in 1863 — the world\'s oldest metro.' },
  { id: 'par',  name: 'Paris',          country: 'France',       lat: 48.8566,  lng: 2.3522,   fact: 'The Eiffel Tower grows 6 inches taller in summer heat.' },
  { id: 'tok',  name: 'Tokyo',          country: 'Japan',        lat: 35.6762,  lng: 139.6503, fact: 'Tokyo has the most Michelin-starred restaurants of any city on Earth.' },
  { id: 'syd',  name: 'Sydney',         country: 'Australia',    lat: -33.8688, lng: 151.2093, fact: 'The Sydney Opera House has over one million roof tiles.' },
  { id: 'dxb',  name: 'Dubai',          country: 'UAE',          lat: 25.2048,  lng: 55.2708,  fact: 'About 25% of the world\'s operating cranes are in Dubai.' },
  { id: 'rio',  name: 'Rio de Janeiro', country: 'Brazil',       lat: -22.9068, lng: -43.1729, fact: 'Christ the Redeemer is struck by lightning 3–4 times per year.' },
  { id: 'sin',  name: 'Singapore',      country: 'Singapore',    lat: 1.3521,   lng: 103.8198, fact: 'Singapore has no natural water — it desalinates and recycles everything.' },
  { id: 'ams',  name: 'Amsterdam',      country: 'Netherlands',  lat: 52.3676,  lng: 4.9041,   fact: 'Amsterdam has more bicycles than residents.' },
  { id: 'bcn',  name: 'Barcelona',      country: 'Spain',        lat: 41.3851,  lng: 2.1734,   fact: 'Sagrada Família has been under construction since 1882.' },
  { id: 'ist',  name: 'Istanbul',       country: 'Turkey',       lat: 41.0082,  lng: 28.9784,  fact: 'Istanbul is the only city that spans two continents.' },
  { id: 'bali', name: 'Bali',           country: 'Indonesia',    lat: -8.4095,  lng: 115.1889, fact: 'Bali has over 20,000 temples — it\'s called the Island of Gods.' },
  { id: 'cpt',  name: 'Cape Town',      country: 'South Africa', lat: -33.9249, lng: 18.4241,  fact: 'Table Mountain is one of the oldest mountains on Earth — over 600M years.' },
  { id: 'kyo',  name: 'Kyoto',          country: 'Japan',        lat: 35.0116,  lng: 135.7681, fact: 'Kyoto was Japan\'s capital for over 1,000 years.' },
  { id: 'lis',  name: 'Lisbon',         country: 'Portugal',     lat: 38.7223,  lng: -9.1393,  fact: 'Lisbon is older than Rome, founded around 1200 BC.' },
  { id: 'rvk',  name: 'Reykjavik',      country: 'Iceland',      lat: 64.1466,  lng: -21.9426, fact: 'Reykjavik runs on nearly 100% renewable geothermal energy.' },
  { id: 'mex',  name: 'Mexico City',    country: 'Mexico',       lat: 19.4326,  lng: -99.1332, fact: 'Mexico City is the largest Spanish-speaking city in the world.' },
  { id: 'bkk',  name: 'Bangkok',        country: 'Thailand',     lat: 13.7563,  lng: 100.5018, fact: 'Bangkok\'s ceremonial name is 169 characters long.' },
  { id: 'mar',  name: 'Marrakech',      country: 'Morocco',      lat: 31.6295,  lng: -7.9811,  fact: 'The Djemaa el-Fna square has been a UNESCO heritage site since 2001.' },
  { id: 'bue',  name: 'Buenos Aires',   country: 'Argentina',    lat: -34.6037, lng: -58.3816, fact: 'Buenos Aires has more bookshops per person than any other city.' },
]

type City = typeof CITIES[number]

// ─── Flight helpers ───────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function flightMins(distKm: number) {
  return Math.round(distKm / 900 * 60) + 60
}

function fmtDuration(totalMins: number) {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
}

function fmtCountdown(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

const MAP_W = 800
const MAP_H = 400

function project(lat: number, lng: number): [number, number] {
  return [(lng + 180) / 360 * MAP_W, (90 - lat) / 180 * MAP_H]
}

function interpolateGC(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number,
): [number, number] {
  const toR = (d: number) => d * Math.PI / 180
  const toD = (r: number) => r * 180 / Math.PI
  const φ1 = toR(lat1), λ1 = toR(lng1)
  const φ2 = toR(lat2), λ2 = toR(lng2)
  const dσ = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ))
  if (dσ < 1e-6) return [lat1, lng1]
  const A = Math.sin((1 - t) * dσ) / Math.sin(dσ)
  const B = Math.sin(t * dσ) / Math.sin(dσ)
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
  const z = A * Math.sin(φ1) + B * Math.sin(φ2)
  return [toD(Math.atan2(z, Math.sqrt(x * x + y * y))), toD(Math.atan2(y, x))]
}

function gcPathD(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  n: number,
  maxT: number,
): string {
  let d = ''
  let prevX: number | null = null
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * maxT
    const [lat, lng] = interpolateGC(lat1, lng1, lat2, lng2, t)
    const [x, y] = project(lat, lng)
    if (prevX === null) {
      d += `M${x.toFixed(1)},${y.toFixed(1)}`
    } else if (Math.abs(x - prevX) > MAP_W / 2) {
      d += ` M${x.toFixed(1)},${y.toFixed(1)}`
    } else {
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`
    }
    prevX = x
  }
  return d
}

function planePosAt(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number,
): { x: number; y: number; rotate: number } {
  const [lat, lng] = interpolateGC(lat1, lng1, lat2, lng2, t)
  const [x, y] = project(lat, lng)
  const tN = Math.min(t + 0.01, 1)
  const [latN, lngN] = interpolateGC(lat1, lng1, lat2, lng2, tN)
  const [xN, yN] = project(latN, lngN)
  const rotate = Math.atan2(yN - y, xN - x) * 180 / Math.PI
  return { x, y, rotate }
}

// Simplified continent outlines as [lat, lng] pairs
const LANDS: Array<[number, number][]> = [
  [[72,-168],[83,-90],[68,-55],[60,-65],[47,-54],[45,-65],[25,-80],[8,-77],[15,-90],[22,-110],[32,-117],[48,-125],[60,-145],[72,-168]],
  [[83,-25],[72,-20],[60,-44],[70,-52],[83,-25]],
  [[10,-77],[8,-61],[4,-51],[-3,-35],[-15,-39],[-23,-43],[-33,-71],[-55,-68],[-40,-62],[-22,-41],[-3,-35],[10,-77]],
  [[71,28],[62,5],[57,-4],[51,-4],[48,-5],[43,-9],[36,-9],[36,15],[43,17],[48,14],[55,22],[60,30],[71,28]],
  [[37,-5],[37,37],[30,32],[22,37],[12,44],[5,43],[-4,40],[-15,35],[-34,26],[-35,18],[-25,33],[37,37],[37,-5]],
  [[72,60],[72,180],[20,125],[5,100],[5,80],[15,52],[30,50],[37,37],[55,22],[60,30],[70,60],[72,60]],
  [[-10,135],[-10,152],[-23,154],[-38,146],[-38,140],[-34,115],[-22,114],[-18,122],[-10,135]],
]

function landD(pts: [number, number][]): string {
  return pts.map(([lat, lng], i) => {
    const [x, y] = project(lat, lng)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + 'Z'
}

// ─── World Map ────────────────────────────────────────────────────────────────

function WorldMap({ origin, dest, progress }: { origin: City; dest: City; progress: number }) {
  const ink = '#2c1f14'
  const t = Math.max(0.01, Math.min(0.99, progress))
  const fullD = gcPathD(origin.lat, origin.lng, dest.lat, dest.lng, 80, 1)
  const travelD = progress > 0.01
    ? gcPathD(origin.lat, origin.lng, dest.lat, dest.lng, 80, t)
    : ''
  const plane = planePosAt(origin.lat, origin.lng, dest.lat, dest.lng, t)
  const [ox, oy] = project(origin.lat, origin.lng)
  const [dx, dy] = project(dest.lat, dest.lng)

  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: '100%', maxWidth: MAP_W, height: 'auto', display: 'block' }}>
      <defs>
        <filter id="map-sketch" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.03" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="#ddd8ce" />
      {LANDS.map((pts, i) => (
        <path key={i} d={landD(pts)} fill="#c6bfb2" stroke={ink} strokeWidth={0.9} strokeLinejoin="round" filter="url(#map-sketch)" opacity={0.88} />
      ))}
      <path d={fullD} fill="none" stroke={ink} strokeWidth={1.5} strokeDasharray="5 7" opacity={0.22} />
      {travelD && <path d={travelD} fill="none" stroke={ink} strokeWidth={2.8} opacity={0.72} />}
      <circle cx={ox} cy={oy} r={5.5} fill={ink} opacity={0.9} />
      <text x={ox + 8} y={oy + 5} fontSize={13} fill={ink} opacity={0.8} fontFamily="Georgia, serif" fontStyle="italic">{origin.name}</text>
      <circle cx={dx} cy={dy} r={5.5} fill="none" stroke={ink} strokeWidth={2} opacity={0.9} />
      <circle cx={dx} cy={dy} r={9} fill="none" stroke={ink} strokeWidth={1} opacity={0.18} />
      <text x={dx + 8} y={dy + 5} fontSize={13} fill={ink} opacity={0.8} fontFamily="Georgia, serif" fontStyle="italic">{dest.name}</text>
      <g transform={`translate(${plane.x.toFixed(1)},${plane.y.toFixed(1)}) rotate(${plane.rotate.toFixed(1)})`}>
        <path d="M0,-11 L7,7 L0,4 L-7,7 Z" fill={ink} />
        <path d="M-13,1.5 L0,-1 L13,1.5" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-6,6 L0,4.5 L6,6" fill="none" stroke={ink} strokeWidth={1.2} strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ─── Flight sounds ────────────────────────────────────────────────────────────

function playDing() {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)() as AudioContext
  // Classic two-tone cabin chime: D5 then G5
  const tones: [number, number][] = [[587, 0], [784, 0.38]]
  for (const [freq, startDelay] of tones) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(env).connect(ctx.destination)
    const t = ctx.currentTime + startDelay
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.28, t + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    osc.start(t)
    osc.stop(t + 2.5)
  }
  setTimeout(() => ctx.close().catch(() => {}), 3500)
}

// Seatbelt sign chime — sharper, higher than the cabin chime
function playSeatbeltSign() {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)() as AudioContext
  const tones: [number, number][] = [[880, 0], [659, 0.18]]
  for (const [freq, startDelay] of tones) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(env).connect(ctx.destination)
    const t = ctx.currentTime + startDelay
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.32, t + 0.007)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
    osc.start(t)
    osc.stop(t + 1.8)
  }
  setTimeout(() => ctx.close().catch(() => {}), 2800)
}

function speakPA(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate   = 0.84
  u.pitch  = 0.88
  u.volume = 0.95
  const voices = window.speechSynthesis.getVoices()
  const pick = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Karen') ||
    v.name.includes('Moira')    || v.name.includes('Serena') ||
    v.name.includes('Victoria')
  ) ?? voices.find(v => v.lang.startsWith('en')) ?? null
  if (pick) u.voice = pick
  window.speechSynthesis.speak(u)
}

// ─── Flight announcements ─────────────────────────────────────────────────────

function useFlightAnnouncements(
  phase: 'boarding' | 'inflight' | 'landed',
  progress: number,
  origin: City | null,
  dest: City | null,
) {
  const done = useRef<Set<string>>(new Set())

  const announce = useCallback((
    key: string,
    text: string,
    chime: 'ding' | 'seatbelt' = 'ding',
    delayMs = 0,
  ) => {
    if (done.current.has(key)) return
    done.current.add(key)
    const chimeFn = chime === 'seatbelt' ? playSeatbeltSign : playDing
    setTimeout(() => {
      chimeFn()
      setTimeout(() => speakPA(text), 1500)
    }, delayMs)
  }, [])

  useEffect(() => {
    if (phase === 'boarding') {
      done.current.clear()
      window.speechSynthesis?.cancel()
    }
  }, [phase])

  // Welcome aboard — fires immediately when inflight starts
  useEffect(() => {
    if (phase !== 'inflight' || !dest || !origin) return
    const dist = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng)
    announce('welcome',
      `Ladies and gentlemen, welcome aboard. ` +
      `Today we'll be flying from ${origin.name} to ${dest.name}, ` +
      `with an estimated flight time of ${fmtDuration(flightMins(dist))}. ` +
      `Please ensure your seatbelts are securely fastened, your seat backs are in the upright position, ` +
      `and all electronic devices are switched to flight mode as we prepare for departure.`,
      'seatbelt',
    )
  }, [phase, origin, dest, announce])

  // Progress-based announcements
  useEffect(() => {
    if (phase !== 'inflight' || !dest) return

    if (progress >= 0.03) {
      announce('pushback',
        `Cabin crew, doors to manual and cross-check. All doors are armed and cross-checked. ` +
        `Ladies and gentlemen, we are now pushing back from the gate and taxiing to the runway.`,
        'ding',
      )
    }

    if (progress >= 0.08) {
      announce('lineup',
        `Cabin crew, please be seated for takeoff. ` +
        `Ladies and gentlemen, we are now lined up on the runway and are cleared for immediate departure. ` +
        `Please ensure your seatbelts are tightly fastened.`,
        'seatbelt',
      )
    }

    if (progress >= 0.13) {
      announce('airborne',
        `Ladies and gentlemen, we are now airborne. ` +
        `The captain has switched off the fasten seatbelt sign. ` +
        `You are now free to move about the cabin. ` +
        `On behalf of your captain and the entire crew, we hope you enjoy your flight to ${dest.name}.`,
        'seatbelt',
      )
    }

    if (progress >= 0.32) {
      announce('service',
        `Ladies and gentlemen, your cabin crew will be coming through the cabin shortly ` +
        `with a selection of beverages and light refreshments. ` +
        `If there is anything you need at any time during the flight, ` +
        `please do not hesitate to press the call button above you.`,
        'ding',
      )
    }

    if (progress >= 0.78) {
      announce('descent',
        `Ladies and gentlemen, the captain has switched on the fasten seatbelt sign. ` +
        `We have begun our initial descent into ${dest.name}. ` +
        `Please return to your seats, fasten your seatbelts, ` +
        `and ensure all tray tables are stowed and your seat backs are in the full upright position. ` +
        `We will be landing shortly. Thank you for your cooperation.`,
        'seatbelt',
      )
    }
  }, [phase, progress, dest, announce])

  // Landing
  useEffect(() => {
    if (phase !== 'landed' || !dest) return
    announce('land',
      `Ladies and gentlemen, we have landed in ${dest.name}. ` +
      `Please remain seated with your seatbelts fastened until the aircraft has come to a complete stop ` +
      `and the seatbelt sign has been switched off. ` +
      `On behalf of your captain and the entire crew, thank you so much for flying with us today — ` +
      `we hope to see you on board again very soon. ` +
      `Cabin crew, doors to manual and cross-check. Welcome to ${dest.name}.`,
      'ding',
    )
  }, [phase, dest, announce])

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])
}

// ─── Flight ambient sound ─────────────────────────────────────────────────────

function useFlightSound(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!active) { ctxRef.current?.close().catch(() => {}); ctxRef.current = null; return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)() as AudioContext
    ctxRef.current = ctx
    const master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)

    for (const [freq, vol] of [[68, 0.4], [82, 0.25], [136, 0.1], [210, 0.05]] as [number, number][]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      const filt = ctx.createBiquadFilter()
      filt.type = 'lowpass'
      filt.frequency.value = freq * 3
      const g = ctx.createGain()
      g.gain.value = vol
      osc.connect(filt).connect(g).connect(master)
      osc.start()
    }

    const bufLen = 3 * ctx.sampleRate
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1
    const airSrc = ctx.createBufferSource()
    airSrc.buffer = buf
    airSrc.loop = true
    const airFilt = ctx.createBiquadFilter()
    airFilt.type = 'bandpass'
    airFilt.frequency.value = 900
    airFilt.Q.value = 0.3
    const airGain = ctx.createGain()
    airGain.gain.value = 0.2
    airSrc.connect(airFilt).connect(airGain).connect(master)
    airSrc.start()

    return () => { ctx.close().catch(() => {}) }
  }, [active])
}

// ─── Cloud ───────────────────────────────────────────────────────────────────

function Cloud({ y, size, speed, delay, opacity }: {
  y: number; size: number; speed: number; delay: number; opacity: number
}) {
  return (
    <motion.div
      style={{ position: 'absolute', top: `${y}%`, left: 0, transform: 'translateY(-50%)' }}
      animate={{ x: [560, -size] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}
    >
      <div style={{ position: 'relative', width: size, height: size * 0.5 }}>
        {[
          { left: '20%', top: '10%', w: '60%', h: '90%' },
          { left: '5%',  top: '30%', w: '40%', h: '70%' },
          { left: '45%', top: '20%', w: '50%', h: '80%' },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', ...s, width: s.w, height: s.h,
            borderRadius: '50%',
            backgroundColor: `rgba(255,255,255,${opacity})`,
            filter: `blur(${size / 12}px)`,
          }} />
        ))}
      </div>
    </motion.div>
  )
}

const CLOUDS = [
  { y: 35, size: 110, speed: 18, delay: 0,   opacity: 0.92 },
  { y: 55, size: 160, speed: 26, delay: 3,   opacity: 0.88 },
  { y: 42, size: 75,  speed: 14, delay: 7,   opacity: 0.75 },
  { y: 65, size: 130, speed: 22, delay: 1,   opacity: 0.85 },
  { y: 28, size: 90,  speed: 16, delay: 11,  opacity: 0.7  },
  { y: 72, size: 100, speed: 20, delay: 5,   opacity: 0.9  },
  { y: 48, size: 140, speed: 30, delay: 8,   opacity: 0.8  },
  { y: 60, size: 80,  speed: 17, delay: 14,  opacity: 0.78 },
]

// ─── Flight Mode ──────────────────────────────────────────────────────────────

function FlightMode({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'boarding' | 'inflight' | 'landed'>('boarding')
  const [origin, setOrigin] = useState<City | null>(null)
  const [dest, setDest] = useState<City | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [totalSecs, setTotalSecs] = useState(0)
  const [secsLeft, setSecsLeft] = useState(0)
  const [mapView, setMapView] = useState(false)

  useFlightSound(phase === 'inflight')

  const detectLocation = () => {
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        let nearest = CITIES[0]!
        let minDist = Infinity
        for (const c of CITIES) {
          const d = haversineKm(latitude, longitude, c.lat, c.lng)
          if (d < minDist) { minDist = d; nearest = c }
        }
        setOrigin(nearest)
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
    )
  }

  useEffect(() => {
    if (phase !== 'inflight') return
    const id = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { clearInterval(id); setPhase('landed'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const board = () => {
    if (!origin || !dest) return
    const secs = flightMins(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng)) * 60
    setTotalSecs(secs)
    setSecsLeft(secs)
    setPhase('inflight')
  }

  const progress = totalSecs > 0 ? (1 - secsLeft / totalSecs) : 0
  useFlightAnnouncements(phase, progress, origin, dest)

  // Seatbelt sign ON during takeoff climb and descent
  const seatbeltOn = phase === 'inflight' && (progress < 0.13 || progress >= 0.78)

  const destOptions = CITIES.filter((c) => c.id !== origin?.id)
  const ink = 'var(--ink, #1a1916)'
  const muted = 'var(--ink-2, #78716c)'
  const faint = 'var(--ink-3, #a8a29e)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 32 }}>
      <AnimatePresence mode="wait">

        {/* ── Boarding ── */}
        {phase === 'boarding' && (
          <motion.div
            key="boarding"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div style={{ textAlign: 'center' }}>
              <svg width={52} height={38} viewBox="0 0 52 38" style={{ display: 'block', margin: '0 auto 14px' }}>
                <path d="M26,4 L38,26 L26,22 L14,26 Z" fill="none" stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M6,17 L26,13 L46,17" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
                <path d="M17,26 L26,24 L35,26" fill="none" stroke={ink} strokeWidth={1.1} strokeLinecap="round" />
              </svg>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: ink, marginBottom: 6 }}>
                Where are you flying from?
              </p>
              <p style={{ fontSize: 12, color: muted }}>
                The flight time becomes your guilt-free lazy window.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={origin?.id ?? ''}
                onChange={(e) => setOrigin(CITIES.find((c) => c.id === e.target.value) ?? null)}
                style={{
                  flex: 1, padding: '10px 12px', fontSize: 13,
                  border: '1px solid rgba(26,25,22,0.15)',
                  backgroundColor: 'var(--paper, #fff)',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  color: ink, outline: 'none',
                }}
              >
                <option value="">— pick your city —</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
                ))}
              </select>
              <button
                onClick={detectLocation}
                disabled={geoLoading}
                style={{
                  padding: '10px 12px', fontSize: 11,
                  border: '1px solid rgba(26,25,22,0.15)',
                  color: muted, backgroundColor: 'transparent',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {geoLoading ? '...' : 'Detect location'}
              </button>
            </div>

            <select
              value={dest?.id ?? ''}
              onChange={(e) => setDest(CITIES.find((c) => c.id === e.target.value) ?? null)}
              style={{
                padding: '10px 12px', fontSize: 13,
                border: '1px solid rgba(26,25,22,0.15)',
                backgroundColor: 'var(--paper, #fff)',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                color: ink, outline: 'none',
              }}
            >
              <option value="">— where do you dream of going? —</option>
              {destOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
              ))}
            </select>

            {origin && dest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '14px 18px',
                  border: '1px solid rgba(26,25,22,0.10)',
                  backgroundColor: 'rgba(26,25,22,0.03)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: muted }}>
                  {origin.name} — {dest.name}
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: ink, marginTop: 4 }}>
                  {fmtDuration(flightMins(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng)))} of lazy time
                </p>
                <p style={{ fontSize: 11, color: faint, marginTop: 4 }}>
                  ~{Math.round(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng)).toLocaleString()} km
                </p>
              </motion.div>
            )}

            <motion.button
              onClick={board}
              disabled={!origin || !dest}
              whileHover={origin && dest ? { scale: 1.02 } : {}}
              whileTap={origin && dest ? { scale: 0.97 } : {}}
              style={{
                padding: '14px', fontSize: 14,
                backgroundColor: origin && dest ? ink : 'rgba(26,25,22,0.1)',
                color: origin && dest ? 'var(--paper, #fff)' : faint,
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                border: 'none', cursor: origin && dest ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              Board the flight
            </motion.button>
          </motion.div>
        )}

        {/* ── In flight ── */}
        {phase === 'inflight' && dest && origin && (
          <motion.div
            key="inflight"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', maxWidth: 880, padding: '0 24px' }}
          >
            {/* Route header + seatbelt sign + view toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: muted, letterSpacing: '0.04em' }}>
                {origin.name} — {dest.name}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Seatbelt sign indicator */}
                <AnimatePresence>
                  {seatbeltOn && (
                    <motion.div
                      key="seatbelt"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 11px',
                        border: '1px solid rgba(220,38,38,0.28)',
                        backgroundColor: 'rgba(220,38,38,0.07)',
                        fontSize: 10, color: '#dc2626',
                        fontFamily: 'Georgia, serif', fontStyle: 'italic',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}
                    >
                      <motion.div
                        style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }}
                        animate={{ opacity: [1, 0.25, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      />
                      fasten seatbelt
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* View toggle */}
                <div style={{ display: 'flex' }}>
                  {(['window', 'map'] as const).map((v, i) => {
                    const active = mapView ? v === 'map' : v === 'window'
                    return (
                      <button
                        key={v}
                        onClick={() => setMapView(v === 'map')}
                        style={{
                          padding: '5px 13px', fontSize: 11,
                          fontFamily: 'Georgia, serif', fontStyle: 'italic',
                          color: active ? ink : faint,
                          backgroundColor: active ? 'rgba(26,25,22,0.07)' : 'transparent',
                          border: '1px solid rgba(26,25,22,0.12)',
                          borderRight: i === 0 ? 'none' : '1px solid rgba(26,25,22,0.12)',
                          cursor: 'pointer',
                        }}
                      >
                        {v}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Window or Map */}
            <AnimatePresence mode="wait">
              {!mapView ? (
                <motion.div
                  key="window"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 500, height: 360,
                    borderRadius: '50% / 42%',
                    overflow: 'hidden',
                    border: '16px solid #2a2218',
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), 0 16px 60px rgba(0,0,0,0.45)',
                    position: 'relative', flexShrink: 0,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #4a9eff 0%, #7ec8f8 40%, #b8e4ff 70%, #d8f0ff 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(255,240,200,0.3), transparent)' }} />
                  {CLOUDS.map((c, i) => <Cloud key={i} {...c} />)}
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ width: '100%', border: '2px solid #2a2218', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                >
                  <WorldMap origin={origin} dest={dest} progress={progress} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 6 }}>
                lazy time remaining
              </p>
              <p style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 36, color: ink, letterSpacing: '0.06em' }}>
                {fmtCountdown(secsLeft)}
              </p>

              <div style={{ width: '100%', maxWidth: 520, height: 6, backgroundColor: 'rgba(26,25,22,0.08)', marginTop: 18, position: 'relative', borderRadius: 3 }}>
                <motion.div
                  style={{ position: 'absolute', left: 0, top: 0, height: '100%', backgroundColor: ink, borderRadius: 3 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
                <motion.div
                  style={{ position: 'absolute', top: -13 }}
                  animate={{ left: `${Math.max(0, progress * 100 - 2)}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                >
                  <svg width={28} height={22} viewBox="0 0 28 22">
                    <path d="M14,1 L21,17 L14,14 L7,17 Z" fill={ink} />
                    <path d="M2,10 L14,7 L26,10" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M8,17 L14,15 L20,17" fill="none" stroke={ink} strokeWidth={1.1} strokeLinecap="round" />
                  </svg>
                </motion.div>
              </div>
            </div>

            <p style={{ maxWidth: 360, textAlign: 'center', fontSize: 12, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7 }}>
              {dest.fact}
            </p>

            <button
              onClick={() => setPhase('landed')}
              style={{ fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(26,25,22,0.15)', paddingBottom: 2 }}
            >
              Land early
            </button>
          </motion.div>
        )}

        {/* ── Landed ── */}
        {phase === 'landed' && dest && (
          <motion.div
            key="landed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', maxWidth: 380 }}
          >
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: ink, marginBottom: 8 }}>
              Welcome to {dest.name}.
            </p>
            <p style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', marginBottom: 28, lineHeight: 1.7 }}>
              Time to head back home and get things done. That was your break, well spent.
            </p>
            <button
              onClick={onClose}
              style={{ padding: '12px 24px', fontSize: 13, backgroundColor: ink, color: 'var(--paper, #fff)', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: 'none', cursor: 'pointer' }}
            >
              Back to reality
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'boarding' && (
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 28, right: 36, fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          esc · close
        </button>
      )}
    </div>
  )
}

// ─── Five Minute Mode ─────────────────────────────────────────────────────────

function FiveMinMode({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [secsLeft, setSecsLeft] = useState(5 * 60)
  const [sessions, setSessions] = useState(0)

  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { clearInterval(id); setPhase('done'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const start = () => { setSecsLeft(5 * 60); setPhase('running') }
  const continueMore = () => { setSessions((n) => n + 1); setSecsLeft(5 * 60); setPhase('running') }

  const progress = 1 - secsLeft / (5 * 60)
  const CIRC = 2 * Math.PI * 88
  const ink = 'var(--ink, #1a1916)'
  const muted = 'var(--ink-2, #78716c)'
  const faint = 'var(--ink-3, #a8a29e)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 32 }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 28, right: 36, fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        esc · close
      </button>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', maxWidth: 360 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 28, color: ink, marginBottom: 12 }}>
              Just 5 minutes.
            </p>
            <p style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', lineHeight: 1.8, marginBottom: 32 }}>
              No huge commitment. No finishing everything.<br />
              Just start. You&apos;ll probably keep going once you do.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <motion.div
                style={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(26,25,22,0.18)' }}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <motion.button
              onClick={start}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              style={{ padding: '14px 36px', fontSize: 14, backgroundColor: ink, color: 'var(--paper, #fff)', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: 'none', cursor: 'pointer' }}
            >
              I&apos;ll do 5 minutes
            </motion.button>
          </motion.div>
        )}

        {phase === 'running' && (
          <motion.div key="running" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 24 }}>
              {sessions > 0 ? `session ${sessions + 1}` : 'focus time'}
            </p>
            <svg width={200} height={200} style={{ display: 'block', margin: '0 auto 20px' }}>
              <circle cx={100} cy={100} r={88} fill="none" stroke="rgba(26,25,22,0.07)" strokeWidth={3} />
              <motion.circle
                cx={100} cy={100} r={88}
                fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: CIRC - CIRC * progress }}
                transition={{ duration: 1, ease: 'linear' }}
                transform="rotate(-90 100 100)"
              />
              <text x={100} y={108} textAnchor="middle"
                style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 28, fill: ink }}
              >
                {Math.floor(secsLeft / 60)}:{String(secsLeft % 60).padStart(2, '0')}
              </text>
            </svg>
            <p style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 24 }}>
              Just this. Nothing else right now.
            </p>
            <button
              onClick={() => { setPhase('done'); setSecsLeft(0) }}
              style={{ fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(26,25,22,0.12)', paddingBottom: 2 }}
            >
              I&apos;ll stop after this
            </button>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', maxWidth: 340 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 24, color: ink, marginBottom: 8 }}>
              See? That wasn&apos;t so hard.
            </p>
            <p style={{ fontSize: 12, color: muted, fontFamily: 'Georgia, serif', marginBottom: 28, lineHeight: 1.7 }}>
              {sessions === 0
                ? 'You did 5 minutes. Most people keep going after this.'
                : `You've done ${sessions + 1} sessions — ${(sessions + 1) * 5} minutes of real work.`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <motion.button
                onClick={continueMore}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: '11px 22px', fontSize: 13, backgroundColor: ink, color: 'var(--paper, #fff)', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: 'none', cursor: 'pointer' }}
              >
                5 more minutes
              </motion.button>
              <button
                onClick={onClose}
                style={{ padding: '11px 22px', fontSize: 13, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: '1px solid rgba(26,25,22,0.15)', cursor: 'pointer' }}
              >
                I&apos;m done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Body Reset ───────────────────────────────────────────────────────────────

const BODY_STEPS = [
  { id: 'water',   title: 'Drink a full glass of water',    desc: 'Right now. Just do it.',                      secs: null },
  { id: 'curtain', title: 'Open a curtain or a window',     desc: 'Let real light in.',                          secs: null },
  { id: 'stretch', title: 'Stand up and stretch',           desc: 'Arms up. Roll your neck. Breathe deeply.',    secs: 30 },
  { id: 'eyes',    title: '20-20-20 for your eyes',         desc: 'Look at something 20ft away for 20 seconds.', secs: 20 },
  { id: 'face',    title: 'Wash your face with cold water', desc: 'Splash. Pat dry. Feel different.',            secs: null },
]

function BodyResetMode({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [timerSecs, setTimerSecs] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  const current = BODY_STEPS[step]

  useEffect(() => {
    if (timerSecs === null || timerSecs <= 0) return
    const id = setInterval(() => setTimerSecs((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearInterval(id)
  }, [timerSecs])

  const next = () => {
    setTimerSecs(null)
    if (step + 1 >= BODY_STEPS.length) { setDone(true) } else { setStep(step + 1) }
  }

  const startStep = () => {
    if (current?.secs) setTimerSecs(current.secs)
    else next()
  }

  const ink = 'var(--ink, #1a1916)'
  const muted = 'var(--ink-2, #78716c)'
  const faint = 'var(--ink-3, #a8a29e)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28 }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 28, right: 36, fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        esc · close
      </button>

      <AnimatePresence mode="wait">
        {!done && current ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ textAlign: 'center', maxWidth: 360 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
              {BODY_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: ink,
                  opacity: i < step ? 0.2 : i === step ? 1 : 0.12,
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 20 }}>
              step {step + 1} of {BODY_STEPS.length}
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: ink, marginBottom: 10 }}>
              {current.title}
            </p>
            <p style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', marginBottom: 32, lineHeight: 1.7 }}>
              {current.desc}
            </p>

            {timerSecs !== null && timerSecs > 0 ? (
              <div>
                <p style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 48, color: ink, marginBottom: 20 }}>
                  {timerSecs}
                </p>
              </div>
            ) : (
              <motion.button
                onClick={startStep}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: '12px 28px', fontSize: 13, backgroundColor: ink, color: 'var(--paper, #fff)', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: 'none', cursor: 'pointer' }}
              >
                {current.secs ? `Start (${current.secs}s)` : 'Done'}
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', maxWidth: 340 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, color: ink, marginBottom: 8 }}>
              You&apos;re recharged.
            </p>
            <p style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', lineHeight: 1.7, marginBottom: 28 }}>
              Hydrated, stretched, present. That&apos;s more than most people do. Time to start?
            </p>
            <button
              onClick={onClose}
              style={{ padding: '12px 28px', fontSize: 13, backgroundColor: ink, color: 'var(--paper, #fff)', fontFamily: 'Georgia, serif', fontStyle: 'italic', border: 'none', cursor: 'pointer' }}
            >
              Let&apos;s go
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Energy Check ─────────────────────────────────────────────────────────────

const ENERGY_LEVELS = [
  { id: 'dead',   label: 'Dead',       sub: 'Barely here.',        maxPriority: 'low',    maxTasks: 2 },
  { id: 'low',    label: 'Low energy', sub: 'Going slow today.',   maxPriority: 'medium', maxTasks: 4 },
  { id: 'decent', label: 'Decent',     sub: 'Getting there.',      maxPriority: 'high',   maxTasks: 6 },
  { id: 'locked', label: 'Locked in',  sub: 'Ready to crush it.',  maxPriority: 'urgent', maxTasks: 10 },
] as const

type EnergyId = typeof ENERGY_LEVELS[number]['id']

const PRIO_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 }

function EnergyCheckMode({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const [energy, setEnergy] = useState<EnergyId | null>(null)

  const level = ENERGY_LEVELS.find((e) => e.id === energy)
  const maxP = level ? (PRIO_ORDER[level.maxPriority] ?? 0) : 0

  const filteredTasks = energy
    ? tasks.filter((t) => (PRIO_ORDER[t.priority] ?? 0) <= maxP).slice(0, level?.maxTasks ?? 10)
    : []

  const PRIO_COLOR: Record<string, string> = { urgent: '#dc2626', high: '#ea580c', medium: '#2563eb', low: '#78716c' }
  const ink = 'var(--ink, #1a1916)'
  const faint = 'var(--ink-3, #a8a29e)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28, padding: '0 24px' }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 28, right: 36, fontSize: 11, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        esc · close
      </button>

      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: ink, textAlign: 'center' }}>
        What&apos;s your actual energy right now?
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ENERGY_LEVELS.map((lvl) => (
          <motion.button
            key={lvl.id}
            onClick={() => setEnergy(energy === lvl.id ? null : lvl.id)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: '20px 24px', minWidth: 110, textAlign: 'center',
              border: energy === lvl.id ? `2px solid ${ink}` : '1px solid rgba(26,25,22,0.12)',
              backgroundColor: energy === lvl.id ? 'rgba(26,25,22,0.05)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <p style={{ fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: ink, marginBottom: 4 }}>
              {lvl.label}
            </p>
            <p style={{ fontSize: 10, color: faint, fontFamily: 'Georgia, serif' }}>
              {lvl.sub}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {energy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', width: '100%', maxWidth: 440 }}
          >
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
              tasks for {level?.label.toLowerCase()} energy
            </p>
            {filteredTasks.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: 13, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                No matching tasks right now.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredTasks.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid rgba(26,25,22,0.08)', backgroundColor: 'rgba(26,25,22,0.02)' }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIO_COLOR[t.priority] ?? '#78716c', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontFamily: 'Georgia, serif', color: ink, flex: 1 }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: 10, color: faint, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {t.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Mode card ────────────────────────────────────────────────────────────────

function ModeCard({
  title, desc, color, rotateDeg, delay, onClick,
}: {
  title: string; desc: string; color: string; rotateDeg: number; delay: number; onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0, rotate: rotateDeg }}
      whileHover={{
        y: -6, rotate: 0,
        boxShadow: '4px 10px 32px rgba(0,0,0,0.14)',
        transition: { type: 'spring', stiffness: 420, damping: 24 },
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay }}
      style={{
        padding: '26px 22px', textAlign: 'left',
        backgroundColor: color,
        border: 'none', cursor: 'pointer', width: '100%',
        boxShadow: '2px 3px 14px rgba(0,0,0,0.08)',
      }}
    >
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 16, color: '#1a1916', marginBottom: 7 }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: '#5a534e', fontFamily: 'Georgia, serif', lineHeight: 1.65 }}>
        {desc}
      </p>
    </motion.button>
  )
}

// ─── Mode overlay ─────────────────────────────────────────────────────────────

type ActiveMode = 'flight' | 'fivemin' | 'body' | 'energy' | null

function ModeOverlay({ mode, tasks, onClose }: { mode: ActiveMode; tasks: Task[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'var(--paper, #fff)' }}
    >
      {mode === 'flight'  && <FlightMode onClose={onClose} />}
      {mode === 'fivemin' && <FiveMinMode onClose={onClose} />}
      {mode === 'body'    && <BodyResetMode onClose={onClose} />}
      {mode === 'energy'  && <EnergyCheckMode tasks={tasks} onClose={onClose} />}
    </motion.div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_RING_COLORS = ['#DAEEFF', '#FFF3B0', '#DCFCE7', '#FFE8D6', '#F3E8FF', '#FCE7F3']

function LazyAvatar({ profile }: { profile: LazyProfile | null }) {
  const initial = (profile?.display_name ?? 'U')[0]?.toUpperCase() ?? 'U'
  const nameCode = [...(profile?.display_name ?? 'U')].reduce((s, c) => s + c.charCodeAt(0), 0)
  const ringColor = AVATAR_RING_COLORS[nameCode % AVATAR_RING_COLORS.length] ?? '#DAEEFF'

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.05 }}
      style={{ flexShrink: 0 }}
    >
      {profile?.avatar_url ? (
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: `4px solid ${ringColor}`,
          outline: `3px solid ${ringColor}88`,
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: ringColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontFamily: 'Georgia, serif', fontStyle: 'italic',
          color: '#1a1916', fontWeight: 700,
          border: `4px solid ${ringColor}cc`,
          outline: `3px solid ${ringColor}55`,
        }}>
          {initial}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LazyClient({ tasks, profile }: { tasks: Task[]; profile: LazyProfile | null }) {
  const [activeMode, setActiveMode] = useState<ActiveMode>(null)
  const close = useCallback(() => setActiveMode(null), [])

  const lazyTasks = tasks.filter((t) => t.priority === 'low' || t.tags.includes('lazy'))
  const firstName = profile?.display_name.split(' ')[0] ?? null

  const MODES = [
    {
      id: 'flight' as ActiveMode,
      title: 'Fly Anywhere',
      desc: 'Pick a destination. Flight time = your officially-excused chill window.',
      color: '#DAEEFF',
      rotateDeg: -1.5,
      delay: 0.12,
    },
    {
      id: 'fivemin' as ActiveMode,
      title: '5 Minute Mode',
      desc: 'Just 5 minutes. No commitment. You\'ll probably keep going after. Trust.',
      color: '#FFF3B0',
      rotateDeg: 0.9,
      delay: 0.20,
    },
    {
      id: 'body' as ActiveMode,
      title: 'Body Reset',
      desc: 'Water. Stretch. Open a window. Takes 4 minutes and genuinely helps.',
      color: '#DCFCE7',
      rotateDeg: -0.7,
      delay: 0.28,
    },
    {
      id: 'energy' as ActiveMode,
      title: 'Energy Check',
      desc: 'Be honest about ur vibe right now. Tasks get matched to your level.',
      color: '#FFE8D6',
      rotateDeg: 1.4,
      delay: 0.36,
    },
  ]

  return (
    <>
      <div
        style={{ backgroundColor: 'var(--paper, #fff)', minHeight: 'calc(100dvh - 4.5rem)', overflowY: 'auto', scrollbarWidth: 'none' }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 28px 64px' }}>

          {/* ── Hero ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 44 }}>
            <LazyAvatar profile={profile} />

            <div style={{ flex: 1 }}>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.38 }}
                style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: 34, lineHeight: 1.1, marginBottom: 8,
                  color: 'var(--ink, #1a1916)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'wavy',
                  textDecorationColor: '#FBBF24',
                  textDecorationThickness: 2,
                  textUnderlineOffset: 5,
                }}
              >
                feeling lazy{firstName ? `, ${firstName}` : ''}?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 }}
                style={{ fontSize: 13, color: 'var(--ink-2, #78716c)', fontFamily: 'Georgia, serif', marginBottom: 14, lineHeight: 1.5 }}
              >
                it happens. here&apos;s what actually works.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                <span style={{
                  padding: '3px 11px', fontSize: 11, borderRadius: 20,
                  backgroundColor: '#FFF3B0', color: '#92400e',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                }}>
                  {lazyTasks.length} easy task{lazyTasks.length !== 1 ? 's' : ''} waiting
                </span>
                {profile && (
                  <>
                    <span style={{
                      padding: '3px 11px', fontSize: 11, borderRadius: 20,
                      backgroundColor: '#DAEEFF', color: '#1e40af',
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                    }}>
                      level {profile.level}
                    </span>
                    <span style={{
                      padding: '3px 11px', fontSize: 11, borderRadius: 20,
                      backgroundColor: '#DCFCE7', color: '#166534',
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                    }}>
                      {profile.total_xp.toLocaleString()} xp
                    </span>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* ── Mode section label ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            style={{
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--ink-3, #a8a29e)', fontFamily: 'Georgia, serif', fontStyle: 'italic',
              marginBottom: 16,
            }}
          >
            pick ur mode
          </motion.p>

          {/* ── Mode cards grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 40 }}>
            {MODES.map((m) => (
              <ModeCard
                key={m.id ?? ''}
                title={m.title}
                desc={m.desc}
                color={m.color}
                rotateDeg={m.rotateDeg}
                delay={m.delay}
                onClick={() => setActiveMode(m.id)}
              />
            ))}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, backgroundColor: 'rgba(26,25,22,0.06)', marginBottom: 28 }} />

          {/* ── Easy tasks ── */}
          {lazyTasks.length > 0 ? (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--ink-3, #a8a29e)', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  marginBottom: 14,
                }}
              >
                or just pick one easy task
              </motion.p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lazyTasks.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.52 + i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px',
                      backgroundColor: 'var(--paper-warm, #faf9f7)',
                      border: '1px solid rgba(26,25,22,0.06)',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(26,25,22,0.18)', flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontFamily: 'Georgia, serif', color: 'var(--ink, #1a1916)', flex: 1 }}>
                      {t.title}
                    </p>
                    <span style={{ fontSize: 10, color: 'var(--ink-3, #a8a29e)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {t.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ padding: '28px 0', textAlign: 'center' }}
            >
              <p style={{ fontSize: 13, color: 'var(--ink-3, #a8a29e)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 6 }}>
                nothing on the easy list rn.
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-3, #a8a29e)' }}>
                add low-priority tasks or tag them &quot;lazy&quot; to see them here.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeMode && (
          <ModeOverlay key={activeMode} mode={activeMode} tasks={tasks} onClose={close} />
        )}
      </AnimatePresence>
    </>
  )
}
