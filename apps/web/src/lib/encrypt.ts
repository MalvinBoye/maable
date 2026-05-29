import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// AES-256-GCM encryption for tokens stored in the database.
// Key must be a 64-char hex string (32 bytes) — TOKEN_ENCRYPTION_KEY env var.

export function encryptToken(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex').subarray(0, 32)
  const iv  = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString('base64')
}

export function decryptToken(encrypted: string, keyHex: string): string | null {
  try {
    const buf = Buffer.from(encrypted, 'base64')
    const iv  = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const ct  = buf.subarray(28)
    const key = Buffer.from(keyHex, 'hex').subarray(0, 32)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch { return null }
}
