import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: { default: 'Maable', template: '%s | Maable' },
  description: 'Make life manageable. Track tasks, habits, and progress — and actually enjoy it.',
  keywords: ['productivity', 'habits', 'tasks', 'notes', 'gamification', 'ADHD'],
  authors: [{ name: 'Maable' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Maable',
    title: 'Maable — Make life manageable',
    description: 'Gamified productivity for real life.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maable',
    description: 'Gamified productivity for real life.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Maable',
  },
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
