import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import compression from 'compression'
import { assertConfig, config } from './config.mjs'
import { closePool, connectPool, dbReady, ensureSchema } from './db.mjs'
import {
  adminConfigured,
  adminFromRequest,
  checkLogin,
  clearSession,
  makeLimiter,
  requireAdmin,
  setSession,
} from './auth.mjs'
import * as repo from './repo.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(here, '..', 'dist')

for (const problem of assertConfig()) console.warn('[config]', problem)

const app = express()
app.disable('x-powered-by')
if (config.trustProxy) app.set('trust proxy', config.trustProxy)
app.use(compression())
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const clientIp = (req) => req.ip || req.socket.remoteAddress || 'unknown'

/* ---------------------------------- API ---------------------------------- */

const api = express.Router()

// Tolak permintaan tulis dari situs lain (perlindungan CSRF tambahan di atas SameSite).
api.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  const origin = req.headers.origin
  if (origin) {
    const host = (config.trustProxy && req.headers['x-forwarded-host']) || req.headers.host
    try {
      if (new URL(origin).host !== host) return res.status(403).json({ error: 'Forbidden.' })
    } catch {
      return res.status(403).json({ error: 'Forbidden.' })
    }
  }
  next()
})

const json = express.json({ limit: '12mb' })

/* --- login admin --- */

const loginLimiter = makeLimiter(10, 15 * 60 * 1000)

api.post(
  '/auth/login',
  json,
  wrap(async (req, res) => {
    if (!adminConfigured()) return res.status(503).json({ error: 'Admin login is not configured on the server.' })
    const ip = clientIp(req)
    if (!loginLimiter.take(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
    const ok = await checkLogin(req.body?.email, req.body?.password)
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' })
    loginLimiter.clear(ip)
    setSession(req, res)
    res.json({ ok: true })
  }),
)

api.post('/auth/logout', (req, res) => {
  clearSession(req, res)
  res.json({ ok: true })
})

api.get('/auth/me', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ admin: !!adminFromRequest(req) })
})

/* --- semua yang di bawah ini butuh database --- */

api.use((_req, res, next) => {
  if (!dbReady()) return res.status(503).json({ error: 'Database is not connected.' })
  next()
})

api.get(
  '/health',
  wrap(async (_req, res) => {
    await repo.ping()
    res.json({ ok: true })
  }),
)

const GUEST_READ = new Set(['site_content', 'wishes', 'moments'])
const GUEST_INSERT = new Set(['wishes', 'moments', 'visits'])
const writeLimiter = makeLimiter(60, 10 * 60 * 1000)

function tableOf(req, res) {
  const table = req.params.table
  if (!Object.hasOwn(repo.TABLES, table)) {
    res.status(404).json({ error: 'Unknown table.' })
    return null
  }
  return table
}

/** Isi dari tamu tidak dipercaya: dibersihkan dan dibatasi ukurannya. */
function cleanGuestRow(table, row) {
  if (!row || !repo.validId(row.id) || !row.data || typeof row.data !== 'object') return null
  const d = row.data
  const str = (v, max) => String(v ?? '').trim().slice(0, max)
  const now = Date.now()
  if (table === 'wishes') {
    const name = str(d.name, 120)
    const message = str(d.message, 1000)
    if (!name || !message) return null
    return { id: row.id, data: { id: row.id, name, message, hearts: 0, createdAt: now } }
  }
  if (table === 'moments') {
    const src = typeof d.src === 'string' ? d.src : ''
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(src) || src.length > 4_000_000) return null
    return { id: row.id, data: { id: row.id, src, name: str(d.name, 120), createdAt: now } }
  }
  if (table === 'visits') {
    return { id: row.id, data: { t: Number.isFinite(d.t) ? d.t : now, device: d.device === 'mobile' ? 'mobile' : 'desktop' } }
  }
  return null
}

api.get(
  '/rows/:table',
  wrap(async (req, res) => {
    const table = tableOf(req, res)
    if (!table) return
    if (!GUEST_READ.has(table) && !adminFromRequest(req)) return res.status(403).json({ error: 'Forbidden.' })
    const [, dir] = String(req.query.order || '').split('.')
    const rows = await repo.selectRows(table, { order: dir === 'desc' ? 'desc' : 'asc', limit: Number(req.query.limit) || 0 })
    res.setHeader('Cache-Control', 'no-store')
    res.json(rows)
  }),
)

// Admin: simpan (insert atau update)
api.post(
  '/rows/:table',
  requireAdmin,
  json,
  wrap(async (req, res) => {
    const table = tableOf(req, res)
    if (!table) return
    const rows = Array.isArray(req.body) ? req.body : []
    if (rows.some((r) => !repo.validId(r?.id) || r.data === undefined || r.data === null)) {
      return res.status(400).json({ error: 'Invalid rows.' })
    }
    try {
      await repo.upsertRows(table, rows)
    } catch (err) {
      if (err.errorNum === 1) return res.status(409).json({ error: 'Duplicate guest code.' })
      throw err
    }
    res.json({ ok: true })
  }),
)

// Admin: hapus
api.delete(
  '/rows/:table',
  requireAdmin,
  json,
  wrap(async (req, res) => {
    const table = tableOf(req, res)
    if (!table) return
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(repo.validId) : []
    await repo.deleteRows(table, ids)
    res.json({ ok: true })
  }),
)

// Tamu (atau admin): kirim doa, foto, kunjungan. Tidak bisa menimpa data yang sudah ada.
api.post(
  '/rows/:table/insert',
  json,
  wrap(async (req, res) => {
    const table = tableOf(req, res)
    if (!table) return
    const admin = !!adminFromRequest(req)
    if (!admin) {
      if (!GUEST_INSERT.has(table)) return res.status(403).json({ error: 'Forbidden.' })
      if (!writeLimiter.take(clientIp(req))) return res.status(429).json({ error: 'Too many requests.' })
    }
    const incoming = Array.isArray(req.body) ? req.body.slice(0, 50) : []
    const rows = admin ? incoming.filter((r) => repo.validId(r?.id) && r.data) : incoming.map((r) => cleanGuestRow(table, r)).filter(Boolean)
    await repo.insertRows(table, rows)
    res.json({ ok: true })
  }),
)

// Fungsi khusus tamu (data tamu lain tidak pernah terlihat)
api.post(
  '/rpc/:name',
  json,
  wrap(async (req, res) => {
    const fn = Object.hasOwn(repo.RPC, req.params.name) ? repo.RPC[req.params.name] : null
    if (!fn) return res.status(404).json({ error: 'Unknown function.' })
    if (req.params.name !== 'get_guest' && !adminFromRequest(req) && !writeLimiter.take(clientIp(req))) {
      return res.status(429).json({ error: 'Too many requests.' })
    }
    res.json(await fn(req.body || {}))
  }),
)

/* --- file lagu --- */

const validMediaId = (id) => /^[A-Za-z0-9._-]{1,100}$/.test(id)

api.get(
  '/media/:id',
  wrap(async (req, res) => {
    if (!validMediaId(req.params.id)) return res.status(404).end()
    const file = await repo.getMedia(req.params.id)
    if (!file) return res.status(404).end()
    res.setHeader('Content-Type', file.contentType)
    res.setHeader('Cache-Control', 'no-cache')
    res.send(file.content)
  }),
)

api.put(
  '/media/:id',
  requireAdmin,
  express.raw({ type: () => true, limit: '16mb' }),
  wrap(async (req, res) => {
    if (!validMediaId(req.params.id)) return res.status(400).json({ error: 'Invalid name.' })
    const type = String(req.headers['content-type'] || 'audio/mpeg').split(';')[0].trim().toLowerCase()
    if (!type.startsWith('audio/')) return res.status(415).json({ error: 'Only audio files are allowed.' })
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Empty file.' })
    await repo.putMedia(req.params.id, type, req.body)
    res.json({ ok: true })
  }),
)

api.delete(
  '/media/:id',
  requireAdmin,
  wrap(async (req, res) => {
    if (!validMediaId(req.params.id)) return res.status(400).json({ error: 'Invalid name.' })
    await repo.deleteMedia(req.params.id)
    res.json({ ok: true })
  }),
)

api.use((_req, res) => res.status(404).json({ error: 'Not found.' }))

app.use('/api', api)

/* ------------------------------ situs (dist) ------------------------------ */

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600')
        }
      },
    }),
  )
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(path.join(distDir, 'index.html'))
  })
} else {
  console.warn('[server] Folder dist/ belum ada. Jalankan "npm run build" dulu.')
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' })
  console.error('[error]', err.errorNum ? `ORA-${String(err.errorNum).padStart(5, '0')} ${err.message}` : err)
  res.status(err.status || 500).json({ error: err.status === 503 ? 'Database is not connected.' : 'Server error.' })
})

/* -------------------------------- start up -------------------------------- */

const server = app.listen(config.port, () => {
  console.log(`Server berjalan di http://localhost:${config.port}`)
})

// Server tetap melayani situs walau Oracle belum tersambung; koneksi dicoba ulang otomatis.
async function connectLoop() {
  const { user, password, connectString, autoInit } = config.oracle
  if (!user || !password || !connectString) return
  for (;;) {
    try {
      await connectPool()
      if (autoInit) await ensureSchema()
      console.log('Oracle Database tersambung.')
      return
    } catch (err) {
      console.error('[oracle] Gagal tersambung, coba lagi 15 detik:', err.message)
      await closePool().catch(() => undefined)
      await new Promise((r) => setTimeout(r, 15_000))
    }
  }
}
void connectLoop()

async function shutdown() {
  server.close()
  await closePool().catch(() => undefined)
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
