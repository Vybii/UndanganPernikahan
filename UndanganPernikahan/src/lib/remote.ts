/* ------------------------------------------------------------------ *
 * Klien untuk server sendiri (server/index.mjs) yang menyimpan data di
 * Oracle Database. Memakai fetch biasa, tanpa dependensi tambahan.
 *
 * Dua jenis pengunjung:
 *  - tamu   -> hanya boleh membaca konten publik dan memakai fungsi terbatas
 *              (RSVP, doa, foto, hati) yang dijaga di server
 *  - admin  -> login lewat /api/auth/login; server memberi cookie sesi
 *              HttpOnly, sehingga semua akses admin diperiksa di server
 * ------------------------------------------------------------------ */

const BASE = "/api"

/** Set VITE_DISABLE_API=true untuk menjalankan tampilan saja (data hanya di browser). */
export const remoteEnabled = (import.meta.env.VITE_DISABLE_API as string | undefined) !== "true"

export interface Row {
  id: string
  code?: string
  data: unknown
}

/* -------------------------------- session -------------------------------- */

// Hanya petunjuk untuk UI. Yang menentukan akses admin adalah cookie sesi di server.
const HINT_KEY = "wedding.admin.hint"

function setHint(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(HINT_KEY, "1")
    else window.sessionStorage.removeItem(HINT_KEY)
  } catch {
    /* ignore */
  }
}

/** Petunjuk cepat (sinkron). Halaman admin tetap memastikan ke server lewat refreshSession(). */
export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(HINT_KEY) === "1"
  } catch {
    return false
  }
}

/** Tanya server apakah sesi admin masih berlaku. */
export async function refreshSession(): Promise<boolean> {
  if (!remoteEnabled) return false
  try {
    const res = await fetch(`${BASE}/auth/me`, { credentials: "same-origin", cache: "no-store" })
    const ok = res.ok && !!(await res.json()).admin
    setHint(ok)
    return ok
  } catch {
    return isAdminSession()
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  })
  if (!res.ok) {
    let message = "Invalid email or password."
    try {
      message = (await res.json()).error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  setHint(true)
}

export function signOut() {
  setHint(false)
  void fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "same-origin", keepalive: true }).catch(() => undefined)
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, { credentials: "same-origin", ...init })
  if (res.status === 401 && isAdminSession()) {
    // Sesi admin habis: kembali ke halaman login.
    setHint(false)
    if (window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/admin/login")) {
      window.location.assign("/admin/login")
    }
  }
  return res
}

async function fail(label: string, res: Response): Promise<never> {
  let detail = ""
  try {
    detail = (await res.text()).slice(0, 300)
  } catch {
    /* ignore */
  }
  throw new Error(`${label} failed (${res.status}) ${detail}`.trim())
}

const JSON_HEADERS = { "Content-Type": "application/json" }

/* --------------------------------- tables --------------------------------- */

export async function selectRows(
  table: string,
  opts: { order?: string; limit?: number } = {},
): Promise<Row[]> {
  const q = new URLSearchParams()
  if (opts.order) q.set("order", opts.order)
  if (opts.limit) q.set("limit", String(opts.limit))
  const res = await request(`/rows/${table}?${q}`)
  if (!res.ok) return fail(`Read ${table}`, res)
  return (await res.json()) as Row[]
}

function chunkRows(rows: Row[]): Row[][] {
  // Menjaga setiap request tetap kecil untuk daftar besar (atau foto).
  const chunks: Row[][] = []
  let current: Row[] = []
  let size = 0
  for (const row of rows) {
    const rowSize = JSON.stringify(row).length
    if (current.length > 0 && size + rowSize > 1_500_000) {
      chunks.push(current)
      current = []
      size = 0
    }
    current.push(row)
    size += rowSize
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

async function writeRows(table: string, rows: Row[], path: string): Promise<void> {
  for (const chunk of chunkRows(rows)) {
    const res = await request(path, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(chunk) })
    if (!res.ok) return fail(`Write ${table}`, res)
  }
}

/** Insert atau update (admin). */
export async function upsertRows(table: string, rows: Row[]): Promise<void> {
  if (rows.length === 0) return
  await writeRows(table, rows, `/rows/${table}`)
}

/** Insert saja; baris yang sudah ada dibiarkan (tamu). */
export async function insertRows(table: string, rows: Row[]): Promise<void> {
  if (rows.length === 0) return
  await writeRows(table, rows, `/rows/${table}/insert`)
}

export async function deleteRows(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const res = await request(`/rows/${table}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) return fail(`Delete from ${table}`, res)
}

export async function rpc<T = unknown>(name: string, args: object): Promise<T> {
  const res = await request(`/rpc/${name}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(args),
  })
  if (!res.ok) return fail(`Call ${name}`, res)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/* ------------------------------ file storage ------------------------------ */

export async function uploadMedia(path: string, blob: Blob): Promise<void> {
  const res = await request(`/media/${path}`, {
    method: "PUT",
    headers: { "Content-Type": blob.type || "audio/mpeg" },
    body: blob,
  })
  if (!res.ok) return fail("Upload", res)
}

export async function removeMedia(path: string): Promise<void> {
  const res = await request(`/media/${path}`, { method: "DELETE" })
  if (!res.ok && res.status !== 404) return fail("Remove file", res)
}

export async function fetchMedia(path: string): Promise<Blob | null> {
  const res = await request(`/media/${path}?t=${Date.now()}`)
  if (!res.ok) return null
  return await res.blob()
}
