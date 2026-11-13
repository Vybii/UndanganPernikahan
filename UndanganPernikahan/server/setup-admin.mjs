// Membuat ADMIN_EMAIL, ADMIN_PASSWORD_HASH, dan SESSION_SECRET untuk file .env.
//   npm run setup-admin
import crypto from 'node:crypto'
import readline from 'node:readline'
import { hashPassword } from './auth.mjs'

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) process.stdout.write(s)
        else if (/[\r\n]/.test(s)) process.stdout.write(s)
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

const email = (await ask('Email admin: ')).trim()
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Email tidak valid.')
  process.exit(1)
}
const password = await ask('Password admin (min. 10 karakter): ', { hidden: true })
const again = await ask('Ulangi password: ', { hidden: true })
if (password.length < 10) {
  console.error('Password terlalu pendek (minimal 10 karakter).')
  process.exit(1)
}
if (password !== again) {
  console.error('Password tidak sama.')
  process.exit(1)
}

console.log('\nSalin 3 baris ini ke file .env (atau ke Environment Variables hosting Anda):\n')
console.log(`ADMIN_EMAIL=${email}`)
console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`)
console.log(`SESSION_SECRET=${crypto.randomBytes(48).toString('base64url')}`)
console.log('\nPassword asli tidak disimpan di mana pun. Jangan bagikan isi .env.')
