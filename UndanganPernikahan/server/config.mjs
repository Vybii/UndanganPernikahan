// Memuat file .env (Node 22+) lalu membaca pengaturan server.
try {
  process.loadEnvFile()
} catch {
  /* tidak ada file .env: pakai environment variable dari hosting */
}

const env = process.env
const isProd = env.NODE_ENV === 'production'

export const config = {
  isProd,
  port: Number(env.PORT || 3000),
  trustProxy: env.TRUST_PROXY ? (/^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY) : false,

  oracle: {
    user: env.ORACLE_USER,
    password: env.ORACLE_PASSWORD,
    connectString: env.ORACLE_CONNECT_STRING,
    walletDir: env.ORACLE_WALLET_DIR || '',
    walletPassword: env.ORACLE_WALLET_PASSWORD || '',
    poolMax: Number(env.ORACLE_POOL_MAX || 5),
    autoInit: env.DB_AUTO_INIT !== 'false',
  },

  admin: {
    email: (env.ADMIN_EMAIL || '').trim().toLowerCase(),
    passwordHash: (env.ADMIN_PASSWORD_HASH || '').trim(),
    sessionSecret: env.SESSION_SECRET || '',
    sessionHours: Number(env.SESSION_HOURS || 24),
  },
}

export function assertConfig() {
  const problems = []
  const { oracle, admin } = config
  if (!oracle.user || !oracle.password || !oracle.connectString) {
    problems.push('ORACLE_USER, ORACLE_PASSWORD, dan ORACLE_CONNECT_STRING belum diisi (database tidak akan tersambung).')
  }
  if (!admin.email || !admin.passwordHash) {
    problems.push('ADMIN_EMAIL / ADMIN_PASSWORD_HASH belum diisi: login admin dinonaktifkan. Jalankan: npm run setup-admin')
  }
  if (admin.sessionSecret.length < 32) {
    if (isProd) {
      problems.push('SESSION_SECRET wajib diisi (minimal 32 karakter) di mode production: login admin dinonaktifkan. Jalankan: npm run setup-admin')
      admin.sessionSecret = ''
    } else {
      admin.sessionSecret = 'dev-only-' + Math.random().toString(36).slice(2) + Date.now().toString(36) + '0123456789abcdef'
    }
  }
  return problems
}
