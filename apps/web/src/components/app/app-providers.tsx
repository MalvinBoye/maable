'use client'

import { ADHDProvider } from '@/lib/adhd-context'
import { ArchitectProvider } from '@/lib/architect-context'
import { SimpleModeProvider } from '@/lib/simple-mode-context'
import { TimerProvider } from '@/lib/timer-context'
import { ADHDEffects } from '@/components/app/adhd-effects'
import { ArchitectPanel } from '@/components/app/architect-panel'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SimpleModeProvider>
      <TimerProvider>
        <ADHDProvider>
          <ArchitectProvider>
            {children}
            <ADHDEffects />
            <ArchitectPanel />
          </ArchitectProvider>
        </ADHDProvider>
      </TimerProvider>
    </SimpleModeProvider>
  )
}
