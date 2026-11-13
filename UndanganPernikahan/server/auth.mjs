import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { config } from './config.mjs'

const scrypt = promisify(crypto.scrypt)
const COOKIE = 'wd_session'
const SCRYPT = { N: 16384, r: 8, p: 1 }

/* ------------------------------- kata sandi ------------------------------- */

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = await scrypt(password, salt, 64, SCRYPT)
  return `scrypt:${SCRYPT.N}:${SCRYPT.r}:${SCRYPT.p}:${salt.toString('hex')}:${key.toString('hex')}`
}

// Hash palsu supaya waktu proses sama baik email-nya salah maupun benar.
const DUMMY_HASH = `scrypt:${SCRYPT.N}:${SCRYPT.r}:${SCRYPT.p}:${'00'.repeat(16)}:${'00'.repeat(64)}`

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, saltHex, keyHex] = parts
  const expected = Buffer.from(keyHex, 'hex')
  if (!expected.length) return false
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  return crypto.timingSafeEqual(actual, expected)
}

/* --------------------------------- sesi --------------------------------- */

function sign(body) {
  return crypto.createHmac('sha256', config.admin.sessionSecret).update(body).digest('base64url')
}

function makeToken(email) {
  const exp = Date.now() + config.admin.sessionHours * 3600 * 1000
  const body = Buffer.from(JSON.stringify({ e: email, exp })).toString('base64url')
  return `${body}.${sign(body)}`
}

function readToken(token) {
  if (!config.admin.sessionSecret || typeof token !== 'string') return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

function cookieValue(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return null
}

export function adminFromRequest(req) {
  const data = readToken(cookieValue(req, COOKIE))
  return data && data.e === config.admin.email ? data : null
}

export function requireAdmin(req, res, next) {
  if (adminFromRequest(req)) return next()
  res.status(401).json({ error: 'Not signed in.' })
}

export function adminConfigured() {
  return !!(config.admin.email && config.admin.passwordHash && config.admin.sessionSecret)
}

export async function checkLogin(email, password) {
  const emailOk = String(email || '').trim().toLowerCase() === config.admin.email
  const passOk = await verifyPassword(String(password || ''), emailOk ? config.admin.passwordHash : DUMMY_HASH)
  return emailOk && passOk
}

function cookieAttrs(req, maxAgeSeconds) {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${req.secure ? '; Secure' : ''}`
}

export function setSession(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=${makeToken(config.admin.email)}; ${cookieAttrs(req, config.admin.sessionHours * 3600)}`)
}

export function clearSession(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(req, 0)}`)
}

/* ------------------------------ pembatas laju ------------------------------ */

export function makeLimiter(max, windowMs) {
  const hits = new Map()
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
  }, 60_000).unref()
  return {
    /** true = masih diizinkan */
    take(key) {
      const now = Date.now()
      const cur = hits.get(key)
      if (!cur || cur.reset <= now) {
        hits.set(key, { count: 1, reset: now + windowMs })
        return true
      }
      cur.count++
      return cur.count <= max
    },
    clear(key) {
      hits.delete(key)
    },
  }
}
