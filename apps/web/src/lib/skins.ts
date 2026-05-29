export interface SkinConfig {
  slug: string
  name: string
  description: string
  /** CSS variables injected on [data-skin] */
  vars: {
    '--ink': string
    '--ink-2': string
    '--ink-3': string
    '--ink-border': string
    '--ink-subtle-bg': string
    '--paper': string
    '--paper-warm': string
    '--shadow-card': string
    '--shadow-hover': string
  }
}

export const SKINS: SkinConfig[] = [
  {
    slug: 'ink',
    name: 'Ink',
    description: 'The original. Charcoal on white paper.',
    vars: {
      '--ink':           '#1a1916',
      '--ink-2':         '#78716c',
      '--ink-3':         '#a8a29e',
      '--ink-border':    'rgba(26,25,22,0.07)',
      '--ink-subtle-bg': 'rgba(26,25,22,0.04)',
      '--paper':         '#ffffff',
      '--paper-warm':    '#faf9f7',
      '--shadow-card':   '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(26,25,22,0.07)',
      '--shadow-hover':  '0 14px 44px rgba(0,0,0,0.12), 0 0 0 1px rgba(26,25,22,0.10)',
    },
  },
  {
    slug: 'parchment',
    name: 'Parchment',
    description: 'Warm cream paper. Like writing by candlelight.',
    vars: {
      '--ink':           '#2c1a0e',
      '--ink-2':         '#7a5240',
      '--ink-3':         '#b08878',
      '--ink-border':    'rgba(44,26,14,0.08)',
      '--ink-subtle-bg': 'rgba(44,26,14,0.04)',
      '--paper':         '#fdf5e4',
      '--paper-warm':    '#f5e8cc',
      '--shadow-card':   '0 1px 3px rgba(44,26,14,0.08), 0 0 0 1px rgba(44,26,14,0.09)',
      '--shadow-hover':  '0 14px 44px rgba(44,26,14,0.14), 0 0 0 1px rgba(44,26,14,0.12)',
    },
  },
  {
    slug: 'night',
    name: 'Night',
    description: 'Dark ink on dark paper. For the night owls.',
    vars: {
      '--ink':           '#ede8df',
      '--ink-2':         '#9d9288',
      '--ink-3':         '#635c54',
      '--ink-border':    'rgba(237,232,223,0.08)',
      '--ink-subtle-bg': 'rgba(237,232,223,0.04)',
      '--paper':         '#16130f',
      '--paper-warm':    '#1e1a15',
      '--shadow-card':   '0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(237,232,223,0.07)',
      '--shadow-hover':  '0 14px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(237,232,223,0.12)',
    },
  },
  {
    slug: 'matcha',
    name: 'Matcha',
    description: 'Soft sage green. Calm and focused.',
    vars: {
      '--ink':           '#1a2e1a',
      '--ink-2':         '#4a6b45',
      '--ink-3':         '#7a9b74',
      '--ink-border':    'rgba(26,46,26,0.08)',
      '--ink-subtle-bg': 'rgba(26,46,26,0.04)',
      '--paper':         '#f2f5ee',
      '--paper-warm':    '#e6ede0',
      '--shadow-card':   '0 1px 3px rgba(26,46,26,0.06), 0 0 0 1px rgba(26,46,26,0.08)',
      '--shadow-hover':  '0 14px 44px rgba(26,46,26,0.12), 0 0 0 1px rgba(26,46,26,0.10)',
    },
  },
  {
    slug: 'blueprint',
    name: 'Blueprint',
    description: 'Technical drawing aesthetic. Clear and precise.',
    vars: {
      '--ink':           '#0f2744',
      '--ink-2':         '#3b6ea8',
      '--ink-3':         '#7aaad4',
      '--ink-border':    'rgba(15,39,68,0.08)',
      '--ink-subtle-bg': 'rgba(15,39,68,0.04)',
      '--paper':         '#f0f4fa',
      '--paper-warm':    '#e2eaf5',
      '--shadow-card':   '0 1px 3px rgba(15,39,68,0.06), 0 0 0 1px rgba(15,39,68,0.08)',
      '--shadow-hover':  '0 14px 44px rgba(15,39,68,0.12), 0 0 0 1px rgba(15,39,68,0.10)',
    },
  },
]

export const DEFAULT_SKIN = SKINS[0]!

export function getSkin(slug: string | null | undefined): SkinConfig {
  return SKINS.find((s) => s.slug === slug) ?? DEFAULT_SKIN
}
