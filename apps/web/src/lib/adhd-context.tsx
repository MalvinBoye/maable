'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ADHDLevel = 'off' | 'on' | 'ultra'

interface ADHDContextValue {
  adhdMode:  boolean     // true when level is 'on' OR 'ultra'
  ultraMode: boolean     // true only when level is 'ultra'
  adhdLevel: ADHDLevel
  toggleADHD: () => void
}

const ADHDContext = createContext<ADHDContextValue>({
  adhdMode: false, ultraMode: false, adhdLevel: 'off', toggleADHD: () => {},
})

export function ADHDProvider({ children }: { children: React.ReactNode }) {
  const [adhdLevel, setAdhdLevel] = useState<ADHDLevel>('off')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('maable-adhd') as ADHDLevel | null
      if (saved === 'on' || saved === 'ultra') setAdhdLevel(saved)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('adhd-mode',  adhdLevel !== 'off')
    document.body.classList.toggle('adhd-ultra', adhdLevel === 'ultra')
  }, [adhdLevel])

  const toggleADHD = useCallback(() => {
    setAdhdLevel(v => {
      const next: ADHDLevel = v === 'off' ? 'on' : v === 'on' ? 'ultra' : 'off'
      try { localStorage.setItem('maable-adhd', next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const adhdMode  = adhdLevel !== 'off'
  const ultraMode = adhdLevel === 'ultra'

  return (
    <ADHDContext.Provider value={{ adhdMode, ultraMode, adhdLevel, toggleADHD }}>
      {children}
    </ADHDContext.Provider>
  )
}

export const useADHD = () => useContext(ADHDContext)
