'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type DashSection = 'stats' | 'life-areas' | 'playground'

const DEFAULT_ORDER: DashSection[] = ['stats', 'life-areas', 'playground']
const TUTORIAL_TOTAL = 5

interface ArchitectContextValue {
  architectMode: boolean
  toggleArchitect: () => void
  sectionOrder: DashSection[]
  hiddenSections: Set<DashSection>
  moveSection: (from: number, to: number) => void
  toggleSection: (id: DashSection) => void
  tutorialStep: number | null   // null = not running
  startTutorial: () => void
  nextTutorialStep: () => void
  skipTutorial: () => void
}

const ArchitectContext = createContext<ArchitectContextValue>({
  architectMode: false,
  toggleArchitect: () => {},
  sectionOrder: DEFAULT_ORDER,
  hiddenSections: new Set(),
  moveSection: () => {},
  toggleSection: () => {},
  tutorialStep: null,
  startTutorial: () => {},
  nextTutorialStep: () => {},
  skipTutorial: () => {},
})

export function ArchitectProvider({ children }: { children: React.ReactNode }) {
  const [architectMode, setArchitectMode] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<DashSection[]>(DEFAULT_ORDER)
  const [hiddenSections, setHiddenSections] = useState<Set<DashSection>>(new Set())
  const [tutorialStep, setTutorialStep] = useState<number | null>(null)
  const [seenTutorial, setSeenTutorial] = useState(false)

  useEffect(() => {
    try {
      const order = localStorage.getItem('maable-arch-order')
      if (order) setSectionOrder(JSON.parse(order) as DashSection[])
      const hidden = localStorage.getItem('maable-arch-hidden')
      if (hidden) setHiddenSections(new Set(JSON.parse(hidden) as DashSection[]))
      if (localStorage.getItem('maable-arch-tutorial') === '1') setSeenTutorial(true)
    } catch { /* ignore */ }
  }, [])

  const toggleArchitect = useCallback(() => {
    setArchitectMode(v => {
      const next = !v
      if (next && !seenTutorial) setTutorialStep(0)
      return next
    })
  }, [seenTutorial])

  const moveSection = useCallback((from: number, to: number) => {
    setSectionOrder(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      if (item !== undefined) next.splice(to, 0, item)
      try { localStorage.setItem('maable-arch-order', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleSection = useCallback((id: DashSection) => {
    setHiddenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem('maable-arch-hidden', JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  const markTutorialDone = useCallback(() => {
    setSeenTutorial(true)
    try { localStorage.setItem('maable-arch-tutorial', '1') } catch { /* ignore */ }
  }, [])

  const startTutorial = useCallback(() => setTutorialStep(0), [])

  const nextTutorialStep = useCallback(() => {
    setTutorialStep(prev => {
      if (prev === null) return null
      if (prev >= TUTORIAL_TOTAL - 1) { markTutorialDone(); return null }
      return prev + 1
    })
  }, [markTutorialDone])

  const skipTutorial = useCallback(() => {
    setTutorialStep(null)
    markTutorialDone()
  }, [markTutorialDone])

  return (
    <ArchitectContext value={{
      architectMode, toggleArchitect,
      sectionOrder, hiddenSections,
      moveSection, toggleSection,
      tutorialStep, startTutorial, nextTutorialStep, skipTutorial,
    }}>
      {children}
    </ArchitectContext>
  )
}

export const useArchitect = () => useContext(ArchitectContext)
