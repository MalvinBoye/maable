export interface AvatarOption {
  id: string
  src: string
  label: string
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'chibi-happy',  src: '/illustrations/chibi-happy.png',  label: 'Happy'   },
  { id: 'chibi-calm',   src: '/illustrations/chibi-calm.png',   label: 'Calm'    },
  { id: 'chibi-alert',  src: '/illustrations/chibi-alert.png',  label: 'Alert'   },
  { id: 'chibi-grumpy', src: '/illustrations/chibi-grumpy.png', label: 'Grumpy'  },
  { id: 'chibi-tired',  src: '/illustrations/chibi-tired.png',  label: 'Tired'   },
  { id: 'icon-angel',   src: '/illustrations/icon-angel.png',   label: 'Angel'   },
  { id: 'icon-eh',      src: '/illustrations/icon-eh.png',      label: 'Meh'     },
  { id: 'avatar-user',  src: '/illustrations/avatar-user.png',  label: 'Classic' },
]

export function avatarSrc(avatarUrl: string | null | undefined): string {
  if (!avatarUrl) return '/illustrations/avatar-user.png'
  // If it's one of our illustration IDs, resolve the path
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarUrl || a.src === avatarUrl)
  if (found) return found.src
  // Otherwise treat it as a full URL (uploaded image)
  return avatarUrl
}
