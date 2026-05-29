'use client'

import { ADHDProvider } from '@/lib/adhd-context'
import { ArchitectProvider } from '@/lib/architect-context'
import { ADHDEffects } from '@/components/app/adhd-effects'
import { ArchitectPanel } from '@/components/app/architect-panel'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ADHDProvider>
      <ArchitectProvider>
        {children}
        <ADHDEffects />
        <ArchitectPanel />
      </ArchitectProvider>
    </ADHDProvider>
  )
}
