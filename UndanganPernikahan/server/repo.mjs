import crypto from 'node:crypto'
import { oracledb, withConnection } from './db.mjs'

export const TABLES = {
  guests: 'WD_GUESTS',
  wishes: 'WD_WISHES',
  moments: 'WD_MOMENTS',
  visits: 'WD_VISITS',
  site_content: 'WD_SITE_CONTENT',
}

const clob = (val) => ({ val, type: oracledb.DB_TYPE_CLOB })
const blob = (val) => ({ val, type: oracledb.DB_TYPE_BLOB })
const UNIQUE_VIOLATION = 1

export const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id)

function parse(payload) {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

/* --------------------------------- tabel --------------------------------- */

export async function selectRows(table, { order = 'asc', limit = 0 } = {}) {
  const T = TABLES[table]
  const dir = order === 'desc' ? 'DESC' : 'ASC'
  const max = Math.min(Math.max(Math.floor(limit) || 0, 0), 5000)
  const cols = table === 'guests' ? 'id, code, payload' : 'id, payload'
  const sql = `SELECT ${cols} FROM ${T} ORDER BY created_at ${dir}, id ${dir}${max ? ` FETCH FIRST ${max} ROWS ONLY` : ''}`
  return withConnection(async (conn) => {
    const res = await conn.execute(sql)
    const rows = []
    for (const r of res.rows) {
      const data = parse(r.PAYLOAD)
      if (data === null) continue
      rows.push(table === 'guests' ? { id: r.ID, code: r.CODE ?? undefined, data } : { id: r.ID, data })
    }
    return rows
  })
}

async function upsertOne(conn, table, row) {
  const T = TABLES[table]
  const isGuests = table === 'guests'
  const payload = JSON.stringify(row.data)
  const code = isGuests ? (row.code ? String(row.code).slice(0, 64) : null) : undefined
  const update = () =>
    conn.execute(
      `UPDATE ${T} SET payload = :payload${isGuests ? ', code = :code' : ''} WHERE id = :id`,
      isGuests ? { payload: clob(payload), code, id: row.id } : { payload: clob(payload), id: row.id },
    )
  let r = await update()
  if (r.rowsAffected) return
  try {
    await conn.execute(
      `INSERT INTO ${T} (id, ${isGuests ? 'code, ' : ''}payload) VALUES (:id, ${isGuests ? ':code, ' : ''}:payload)`,
      isGuests ? { id: row.id, code, payload: clob(payload) } : { id: row.id, payload: clob(payload) },
    )
  } catch (err) {
    if (err.errorNum !== UNIQUE_VIOLATION) throw err
    // Baris dibuat bersamaan oleh request lain: coba update sekali lagi.
    r = await update()
    if (!r.rowsAffected) throw err
  }
}

/** Insert atau update (admin). */
export async function upsertRows(table, rows) {
  await withConnection(async (conn) => {
    for (const row of rows) await upsertOne(conn, table, row)
    await conn.commit()
  })
}

/** Insert saja; baris yang sudah ada dibiarkan (tamu). */
export async function insertRows(table, rows) {
  const T = TABLES[table]
  await withConnection(async (conn) => {
    for (const row of rows) {
      try {
        await conn.execute(`INSERT INTO ${T} (id, payload) VALUES (:id, :payload)`, {
          id: row.id,
          payload: clob(JSON.stringify(row.data)),
        })
      } catch (err) {
        if (err.errorNum !== UNIQUE_VIOLATION) throw err
      }
    }
    await conn.commit()
  })
}

export async function deleteRows(table, ids) {
  const T = TABLES[table]
  await withConnection(async (conn) => {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500)
      const binds = {}
      chunk.forEach((id, n) => (binds[`b${n}`] = id))
      const list = chunk.map((_, n) => `:b${n}`).join(',')
      await conn.execute(`DELETE FROM ${T} WHERE id IN (${list})`, binds)
    }
    await conn.commit()
  })
}

/* ------------------------- fungsi khusus tamu (RPC) ------------------------ */

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
const text = (v, max) => String(v ?? '').trim().slice(0, max)

async function lockGuestByCode(conn, code) {
  const r = await conn.execute(`SELECT id, payload FROM WD_GUESTS WHERE code = :code FOR UPDATE`, { code })
  const row = r.rows[0]
  return row ? { id: row.ID, data: parse(row.PAYLOAD) } : null
}

async function saveGuest(conn, id, data) {
  await conn.execute(`UPDATE WD_GUESTS SET payload = :payload WHERE id = :id`, { payload: clob(JSON.stringify(data)), id })
}

export async function getGuest({ p_code }) {
  const code = text(p_code, 64)
  if (!code) return null
  return withConnection(async (conn) => {
    const r = await conn.execute(`SELECT payload FROM WD_GUESTS WHERE code = :code`, { code })
    const data = r.rows[0] ? parse(r.rows[0].PAYLOAD) : null
    if (!data) return null
    delete data.phone // nomor telepon tidak pernah dikirim ke tamu
    return data
  })
}

export async function openGuest({ p_code }) {
  const code = text(p_code, 64)
  if (!code) return null
  await withConnection(async (conn) => {
    const g = await lockGuestByCode(conn, code)
    if (g?.data && !g.data.openedAt) await saveGuest(conn, g.id, { ...g.data, openedAt: Date.now() })
    await conn.commit()
  })
  return null
}

export async function heartWish({ p_id, p_delta }) {
  if (!validId(p_id)) return null
  const delta = clamp(Math.trunc(Number(p_delta) || 0), -1, 1)
  await withConnection(async (conn) => {
    const r = await conn.execute(`SELECT payload FROM WD_WISHES WHERE id = :id FOR UPDATE`, { id: p_id })
    const data = r.rows[0] ? parse(r.rows[0].PAYLOAD) : null
    if (data) {
      data.hearts = Math.max(0, (Number(data.hearts) || 0) + delta)
      await conn.execute(`UPDATE WD_WISHES SET payload = :payload WHERE id = :id`, {
        payload: clob(JSON.stringify(data)),
        id: p_id,
      })
    }
    await conn.commit()
  })
  return null
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newCode() {
  const bytes = crypto.randomBytes(6)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export async function rsvpGuest({ p_code, p_name, p_attending, p_pax, p_message }) {
  const code = text(p_code, 64)
  const name = text(p_name, 120)
  const message = text(p_message, 1000)
  const now = Date.now()
  const patch = {
    status: p_attending ? 'Confirmed' : 'Declined',
    pax: clamp(Math.trunc(Number(p_pax) || 1), 1, 20),
    respondedAt: now,
  }
  if (message) patch.message = message

  await withConnection(async (conn) => {
    let found = code ? await lockGuestByCode(conn, code) : null
    if (!found && name) {
      // Cari berdasarkan nama (tanpa membedakan huruf besar/kecil).
      const all = await conn.execute(`SELECT id, payload FROM WD_GUESTS`)
      const needle = name.toLowerCase()
      const hit = all.rows.find((r) => String(parse(r.PAYLOAD)?.name ?? '').trim().toLowerCase() === needle)
      if (hit) {
        const r = await conn.execute(`SELECT id, payload FROM WD_GUESTS WHERE id = :id FOR UPDATE`, { id: hit.ID })
        if (r.rows[0]) found = { id: r.rows[0].ID, data: parse(r.rows[0].PAYLOAD) }
      }
    }

    if (found?.data) {
      await saveGuest(conn, found.id, { ...found.data, ...patch })
    } else if (name) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const id = crypto.randomBytes(6).toString('hex')
        const newGuestCode = newCode()
        const data = {
          id,
          code: newGuestCode,
          name,
          phone: '',
          category: 'Other',
          checkedIn: false,
          createdAt: now,
          openedAt: now,
          ...patch,
        }
        try {
          await conn.execute(`INSERT INTO WD_GUESTS (id, code, payload) VALUES (:id, :code, :payload)`, {
            id,
            code: newGuestCode,
            payload: clob(JSON.stringify(data)),
          })
          break
        } catch (err) {
          if (err.errorNum !== UNIQUE_VIOLATION || attempt === 4) throw err
        }
      }
    }
    await conn.commit()
  })
  return null
}

export const RPC = {
  get_guest: getGuest,
  open_guest: openGuest,
  heart_wish: heartWish,
  rsvp_guest: rsvpGuest,
}

/* -------------------------------- file media ------------------------------- */

export async function putMedia(id, contentType, buffer) {
  await withConnection(async (conn) => {
    const update = () =>
      conn.execute(
        `UPDATE WD_MEDIA SET content_type = :ct, content = :content, updated_at = SYSTIMESTAMP WHERE id = :id`,
        { ct: contentType, content: blob(buffer), id },
      )
    const r = await update()
    if (!r.rowsAffected) {
      try {
        await conn.execute(`INSERT INTO WD_MEDIA (id, content_type, content) VALUES (:id, :ct, :content)`, {
          id,
          ct: contentType,
          content: blob(buffer),
        })
      } catch (err) {
        if (err.errorNum !== UNIQUE_VIOLATION) throw err
        await update()
      }
    }
    await conn.commit()
  })
}

export async function getMedia(id) {
  return withConnection(async (conn) => {
    const r = await conn.execute(`SELECT content_type, content FROM WD_MEDIA WHERE id = :id`, { id })
    const row = r.rows[0]
    return row ? { contentType: row.CONTENT_TYPE || 'application/octet-stream', content: row.CONTENT } : null
  })
}

export async function deleteMedia(id) {
  await withConnection(async (conn) => {
    await conn.execute(`DELETE FROM WD_MEDIA WHERE id = :id`, { id })
    await conn.commit()
  })
}

export async function ping() {
  await withConnection((conn) => conn.execute('SELECT 1 FROM dual'))
}
