'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mark = 'X' | 'O'
type Cell = Mark | null
type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]
type GameMode = 'menu' | 'local' | 'online-host' | 'online-join' | 'online-play'

interface OnlineState {
  board: Board
  turn: Mark
  winner: string | null
}

// ─── Game logic ───────────────────────────────────────────────────────────────

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function checkWinner(board: Board): { mark: Mark; line: number[] } | 'draw' | null {
  for (const [a, b, c] of WINS) {
    const cell = board[a!]
    if (cell && cell === board[b!] && cell === board[c!]) {
      return { mark: cell, line: [a!, b!, c!] }
    }
  }
  if (board.every(Boolean)) return 'draw'
  return null
}

function emptyBoard(): Board {
  return [null,null,null,null,null,null,null,null,null]
}

function randomCode(): string {
  return Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)!]).join('')
}

// ─── Board cell ───────────────────────────────────────────────────────────────

function Cell({
  value, index, onClick, winLine, disabled,
}: {
  value: Cell
  index: number
  onClick: () => void
  winLine: number[]
  disabled: boolean
}) {
  const inWinLine = winLine.includes(index)
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || !!value}
      className="flex items-center justify-center rounded-xl transition-all"
      style={{
        aspectRatio: '1',
        backgroundColor: inWinLine ? 'rgba(201,168,76,0.10)' : 'rgba(26,25,22,0.035)',
        border: `1.5px solid ${inWinLine ? 'rgba(201,168,76,0.35)' : 'rgba(26,25,22,0.09)'}`,
        cursor: disabled || value ? 'default' : 'pointer',
      }}
      whileHover={!disabled && !value ? { backgroundColor: 'rgba(26,25,22,0.06)' } : {}}
      whileTap={!disabled && !value ? { scale: 0.95 } : {}}
    >
      <AnimatePresence>
        {value && (
          <motion.span
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.8rem',
              color: value === 'X'
                ? inWinLine ? '#c9a84c' : 'rgba(26,25,22,0.75)'
                : inWinLine ? '#c9a84c' : 'rgba(87,83,78,0.70)',
              fontStyle: 'italic',
            }}
          >
            {value === 'X' ? '✕' : '○'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Local (pass-and-play) ────────────────────────────────────────────────────

function LocalGame({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [turn, setTurn] = useState<Mark>('X')
  const [result, setResult] = useState<{ mark: Mark; line: number[] } | 'draw' | null>(null)

  const winLine = result && result !== 'draw' ? result.line : []

  const handleClick = (i: number) => {
    if (board[i] || result) return
    const next = [...board] as Board
    next[i] = turn
    const r = checkWinner(next)
    setBoard(next)
    setResult(r)
    if (!r) setTurn(t => t === 'X' ? 'O' : 'X')
  }

  const reset = () => { setBoard(emptyBoard()); setTurn('X'); setResult(null) }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-6">
        <button onClick={onBack} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.35)' }}>
          ← menu
        </button>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(26,25,22,0.45)' }}>
          pass &amp; play
        </p>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={result ? 'result' : turn}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(26,25,22,0.60)' }}
        >
          {result
            ? result === 'draw'
              ? "it's a draw"
              : `${result.mark === 'X' ? '✕' : '○'} wins`
            : `${turn === 'X' ? '✕' : '○'}'s turn`
          }
        </motion.p>
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 w-72">
        {board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            onClick={() => handleClick(i)}
            winLine={winLine}
            disabled={!!result}
          />
        ))}
      </div>

      {result && (
        <motion.button
          onClick={reset}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 px-6 py-2 rounded-full transition-all"
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: 'rgba(26,25,22,0.60)',
            border: '1px solid rgba(26,25,22,0.15)',
            backgroundColor: 'rgba(26,25,22,0.04)',
          }}
          whileHover={{ backgroundColor: 'rgba(26,25,22,0.08)' }}
        >
          play again
        </motion.button>
      )}
    </div>
  )
}

// ─── Online game ──────────────────────────────────────────────────────────────

function OnlineGame({
  userId, roomCode, myMark, onBack,
}: {
  userId: string
  roomCode: string
  myMark: Mark
  onBack: () => void
}) {
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [turn, setTurn] = useState<Mark>('X')
  const [result, setResult] = useState<{ mark: Mark; line: number[] } | 'draw' | null>(null)
  const [opponentConnected, setOpponentConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`ttt-${roomCode}`)

    channel
      .on('broadcast', { event: 'state' }, ({ payload }: { payload: OnlineState }) => {
        setBoard(payload.board)
        setTurn(payload.turn)
        const r = checkWinner(payload.board)
        setResult(r)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setOpponentConnected(count >= 2)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, mark: myMark })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomCode, userId, myMark, supabase])

  const broadcast = useCallback(async (newBoard: Board, newTurn: Mark, newResult: typeof result) => {
    const winner = newResult === 'draw' ? 'draw' : newResult ? newResult.mark : null
    const channel = supabase.channel(`ttt-${roomCode}`)
    await channel.send({
      type: 'broadcast',
      event: 'state',
      payload: { board: newBoard, turn: newTurn, winner } satisfies OnlineState,
    })
  }, [roomCode, supabase])

  const handleClick = async (i: number) => {
    if (board[i] || result || turn !== myMark) return
    const next = [...board] as Board
    next[i] = myMark
    const r = checkWinner(next)
    const nextTurn: Mark = myMark === 'X' ? 'O' : 'X'
    setBoard(next)
    setResult(r)
    if (!r) setTurn(nextTurn)
    await broadcast(next, nextTurn, r)
  }

  const winLine = result && result !== 'draw' ? result.line : []
  const myTurn = turn === myMark && !result

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-6">
        <button onClick={onBack} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.35)' }}>
          ← leave
        </button>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: opponentConnected ? '#6ab04c' : 'rgba(26,25,22,0.25)',
              transition: 'background-color 0.3s',
            }}
          />
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(26,25,22,0.38)' }}>
            {opponentConnected ? 'both players connected' : 'waiting for opponent…'}
          </span>
        </div>
      </div>

      {/* Room code */}
      <div
        className="mb-4 px-4 py-2 rounded-full"
        style={{ backgroundColor: '#f0ede8', border: '1px solid rgba(26,25,22,0.08)' }}
      >
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(26,25,22,0.42)', letterSpacing: '0.12em' }}>
          room · {roomCode} · you are {myMark === 'X' ? '✕' : '○'}
        </span>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={result ? 'result' : `${turn}-${myMark}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(26,25,22,0.60)' }}
        >
          {result
            ? result === 'draw'
              ? "it's a draw"
              : result.mark === myMark
                ? 'you win ✦'
                : 'opponent wins'
            : myTurn ? 'your turn' : "opponent's turn…"
          }
        </motion.p>
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 w-72">
        {board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            onClick={() => handleClick(i)}
            winLine={winLine}
            disabled={!myTurn || !opponentConnected}
          />
        ))}
      </div>
    </div>
  )
}

// ─── TicTacToe root ───────────────────────────────────────────────────────────

export function TicTacToe({ userId }: { userId: string }) {
  const [mode, setMode] = useState<GameMode>('menu')
  const [roomCode, setRoomCode] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [myMark, setMyMark] = useState<Mark>('X')
  const [joinError, setJoinError] = useState('')

  const startOnlineHost = () => {
    const code = randomCode()
    setRoomCode(code)
    setMyMark('X')
    setMode('online-play')
  }

  const startOnlineJoin = () => {
    const code = joinInput.trim().toUpperCase()
    if (code.length !== 4) { setJoinError('room code must be 4 letters'); return }
    setRoomCode(code)
    setMyMark('O')
    setJoinError('')
    setMode('online-play')
  }

  if (mode === 'local') {
    return <LocalGame onBack={() => setMode('menu')} />
  }

  if (mode === 'online-play') {
    return (
      <OnlineGame
        userId={userId}
        roomCode={roomCode}
        myMark={myMark}
        onBack={() => { setMode('menu'); setRoomCode(''); setJoinInput('') }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center">
      <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'rgba(26,25,22,0.75)', marginBottom: 4 }}>
        Noughts &amp; Crosses
      </h2>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(26,25,22,0.38)', marginBottom: 36 }}>
        choose how to play
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">

        {/* Pass & play */}
        <motion.button
          onClick={() => setMode('local')}
          className="rounded-2xl p-5 text-left transition-all"
          style={{
            backgroundColor: '#f0ede8',
            border: '1px solid rgba(26,25,22,0.07)',
          }}
          whileHover={{ backgroundColor: '#e8e4de' }}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(26,25,22,0.75)', marginBottom: 2 }}>
            pass &amp; play
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(26,25,22,0.38)' }}>
            two players, one device
          </p>
        </motion.button>

        {/* Online — host */}
        <motion.button
          onClick={startOnlineHost}
          className="rounded-2xl p-5 text-left transition-all"
          style={{
            backgroundColor: '#f0ede8',
            border: '1px solid rgba(26,25,22,0.07)',
          }}
          whileHover={{ backgroundColor: '#e8e4de' }}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(26,25,22,0.75)', marginBottom: 2 }}>
            create room
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'rgba(26,25,22,0.38)' }}>
            share a code — play online
          </p>
        </motion.button>

        {/* Online — join */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: '#f0ede8',
            border: '1px solid rgba(26,25,22,0.07)',
          }}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(26,25,22,0.75)', marginBottom: 8 }}>
            join room
          </p>
          <div className="flex gap-2">
            <input
              value={joinInput}
              onChange={e => { setJoinInput(e.target.value.slice(0, 4)); setJoinError('') }}
              placeholder="ABCD"
              maxLength={4}
              className="flex-1 rounded-xl px-3 py-2 outline-none uppercase"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '1rem',
                letterSpacing: '0.18em',
                backgroundColor: '#ffffff',
                border: joinError ? '1px solid #b45252' : '1px solid rgba(26,25,22,0.12)',
                color: 'rgba(26,25,22,0.75)',
                caretColor: 'rgba(26,25,22,0.50)',
              }}
            />
            <motion.button
              onClick={startOnlineJoin}
              disabled={joinInput.trim().length !== 4}
              className="px-4 rounded-xl transition-all"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '0.82rem',
                backgroundColor: 'rgba(26,25,22,0.08)',
                color: 'rgba(26,25,22,0.55)',
                border: '1px solid rgba(26,25,22,0.10)',
                opacity: joinInput.trim().length !== 4 ? 0.4 : 1,
              }}
              whileHover={joinInput.trim().length === 4 ? { backgroundColor: 'rgba(26,25,22,0.13)' } : {}}
            >
              join →
            </motion.button>
          </div>
          {joinError && (
            <p style={{ fontSize: '0.68rem', fontStyle: 'italic', color: '#b45252', marginTop: 6 }}>
              {joinError}
            </p>
          )}
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(26,25,22,0.35)', marginTop: 6 }}>
            enter the 4-letter code your friend shared
          </p>
        </div>
      </div>
    </div>
  )
}
