// Membuat tabel Oracle secara manual:  npm run db:init
import { assertConfig } from './config.mjs'
import { closePool, connectPool, ensureSchema } from './db.mjs'

assertConfig()
try {
  await connectPool()
  await ensureSchema()
} catch (err) {
  console.error('Gagal:', err.message)
  process.exitCode = 1
} finally {
  await closePool().catch(() => undefined)
}
