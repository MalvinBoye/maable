'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TicTacToe } from './ttt/ttt-client'

const GAMES = [
  {
    id: 'ttt',
    name: 'Noughts & Crosses',
    tagline: 'Play on the same device or invite a friend online.',
    icon: '✕ ○',
    available: true,
  },
  {
    id: 'coming',
    name: 'More coming…',
    tagline: 'Word duel, quiz battle, and more.',
    icon: '◇',
    available: false,
  },
]

export function GamesHub({ userId }: { userId: string }) {
  const [playing, setPlaying] = useState<string | null>(null)

  if (playing === 'ttt') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#faf9f7' }}>
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
          <button
            onClick={() => setPlaying(null)}
            className="flex items-center gap-2 mb-6 transition-colors"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(26,25,22,0.38)' }}
          >
            ← games
          </button>
          <TicTacToe userId={userId} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf9f7', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        <div className="mb-8">
          <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.6rem', color: 'rgba(26,25,22,0.80)', letterSpacing: '-0.01em' }}>
            Games
          </h1>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.35)', marginTop: 2 }}>
            play with friends — same device or online
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <button
                onClick={() => game.available && setPlaying(game.id)}
                disabled={!game.available}
                className="w-full text-left rounded-2xl p-6 transition-all"
                style={{
                  backgroundColor: '#f0ede8',
                  border: '1px solid rgba(26,25,22,0.07)',
                  opacity: game.available ? 1 : 0.45,
                  cursor: game.available ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (game.available) e.currentTarget.style.backgroundColor = '#e8e4de' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0ede8' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-sm"
                  style={{ backgroundColor: 'rgba(26,25,22,0.07)', color: 'rgba(26,25,22,0.55)', letterSpacing: '0.1em' }}
                >
                  {game.icon}
                </div>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(26,25,22,0.80)', marginBottom: 4 }}>
                  {game.name}
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(26,25,22,0.40)' }}>
                  {game.tagline}
                </p>
                {game.available && (
                  <div className="mt-4 flex items-center gap-1" style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'rgba(26,25,22,0.35)' }}>
                    play →
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
