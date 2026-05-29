'use client'

import { useEffect } from 'react'
import { getSkin } from '@/lib/skins'

export function SkinProvider({ slug }: { slug: string | null | undefined }) {
  useEffect(() => {
    const skin = getSkin(slug)
    const root = document.documentElement

    // Apply all CSS variables to :root
    for (const [key, value] of Object.entries(skin.vars)) {
      root.style.setProperty(key, value)
    }

    // Also set the data-skin attribute for any CSS selector overrides
    root.dataset.skin = skin.slug

    return () => {
      // Cleanup: reset to default on unmount (shouldn't normally happen)
      root.removeAttribute('data-skin')
    }
  }, [slug])

  return null
}
