import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import oracledb from 'oracledb'
import { config } from './config.mjs'

// Mode "thin": tidak perlu memasang Oracle Instant Client.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
oracledb.fetchAsString = [oracledb.CLOB]
oracledb.fetchAsBuffer = [oracledb.BLOB]

let pool = null

export function dbReady() {
  return pool !== null
}

export async function connectPool() {
  const { user, password, connectString, walletDir, walletPassword, poolMax } = config.oracle
  const options = {
    user,
    password,
    connectString,
    poolMin: 1,
    poolMax,
    poolIncrement: 1,
    poolTimeout: 120,
    queueTimeout: 15000,
  }
  // Oracle Autonomous Database (Cloud): arahkan ke folder wallet hasil unduhan.
  if (walletDir) {
    options.configDir = walletDir
    options.walletLocation = walletDir
    if (walletPassword) options.walletPassword = walletPassword
  }
  pool = await oracledb.createPool(options)
}

export async function closePool() {
  if (pool) {
    const p = pool
    pool = null
    await p.close(10)
  }
}

export async function withConnection(fn) {
  if (!pool) {
    const err = new Error('Database belum tersambung')
    err.status = 503
    throw err
  }
  const conn = await pool.getConnection()
  try {
    return await fn(conn)
  } catch (err) {
    try {
      await conn.rollback()
    } catch {
      /* ignore */
    }
    throw err
  } finally {
    await conn.close()
  }
}

const here = path.dirname(fileURLToPath(import.meta.url))

/** Membuat tabel kalau belum ada (aman dijalankan berulang). */
export async function ensureSchema(log = console.log) {
  const sql = fs
    .readFileSync(path.join(here, 'schema.sql'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  await withConnection(async (conn) => {
    for (const stmt of statements) {
      try {
        await conn.execute(stmt)
      } catch (err) {
        // ORA-00955: nama sudah dipakai, ORA-01408: kolom sudah punya index
        if (err.errorNum === 955 || err.errorNum === 1408) continue
        throw err
      }
    }
  })
  log('Skema database siap.')
}

export { oracledb }
