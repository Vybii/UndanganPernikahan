import { useMemo, useSyncExternalStore } from "react"
import { mergeContent, type SiteContent } from "./content"
import {
  deleteRows,
  fetchMedia,
  insertRows,
  isAdminSession,
  refreshSession,
  remoteEnabled,
  removeMedia,
  rpc,
  selectRows,
  uploadMedia,
  upsertRows,
  type Row,
} from "./remote"

/* ------------------------------------------------------------------ *
 * Persistence layer.
 * - Structured data (content, guests, wishes, visits) lives in localStorage
 *   so it survives reloads and is shared with the live-preview iframe
 *   (same origin) through the `storage` event.
 * - The uploaded audio file is too large for localStorage, so it is kept
 *   in IndexedDB.
 * With the server enabled, everything is also saved to Oracle Database through
 * /api (see server/). Without it, data only lives in the visitor's browser.
 * ------------------------------------------------------------------ */

export const KEYS = {
  content: "wedding.content.v1",
  guests: "wedding.guests.v1",
  wishes: "wedding.wishes.v1",
  visits: "wedding.visits.v1",
  moments: "wedding.moments.v1",
} as const

export type WriteResult = { ok: true } | { ok: false; error: string }

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function emit() {
  listeners.forEach((l) => l())
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key.startsWith("wedding.")) emit()
  })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return cache.get(key)?.raw ?? null
  }
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = readRaw(key)
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: unknown = fallback
  if (raw) {
    try {
      value = JSON.parse(raw)
    } catch {
      value = fallback
    }
  }
  cache.set(key, { raw, value })
  return value as T
}

function peek(key: string): unknown {
  const raw = readRaw(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeStored(
  key: string,
  value: unknown,
  opts: { fromRemote?: boolean } = {},
): WriteResult {
  const previous = opts.fromRemote ? undefined : peek(key)
  const raw = JSON.stringify(value)
  try {
    window.localStorage.setItem(key, raw)
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")
    return {
      ok: false,
      error: quota
        ? "Browser storage is full. Remove some photos or use smaller images, then try again."
        : "Could not write to browser storage. Check that storage is not blocked in your browser.",
    }
  }
  cache.set(key, { raw, value: JSON.parse(raw) })
  emit()
  if (!opts.fromRemote) queueRemote(key, previous, value)
  return { ok: true }
}

/* ------------------------------------------------------------------ *
 * Remote sync (Oracle Database via /api). Local storage stays the instant source for the UI;
 * every change is pushed to the database in the background, and the database
 * is pulled back regularly so all devices (admin + every guest) see the same data.
 * ------------------------------------------------------------------ */

const LIST_TABLES: Record<string, string> = {
  [KEYS.guests]: "guests",
  [KEYS.wishes]: "wishes",
  [KEYS.moments]: "moments",
}
const SEEDED_FLAG = "wedding.seeded.v1"

let pending = 0
let pulling = false
const dirty = new Set<string>()

function stable(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  )
}

function toRow(table: string, item: any): Row {
  return table === "guests"
    ? { id: item.id, code: item.code, data: item }
    : { id: item.id, data: item }
}

function seededAlready(): boolean {
  try {
    return window.localStorage.getItem(SEEDED_FLAG) === "1"
  } catch {
    return true
  }
}

function markSeeded() {
  try {
    window.localStorage.setItem(SEEDED_FLAG, "1")
  } catch {
    /* ignore */
  }
}

function run(key: string, task: () => Promise<void>) {
  pending++
  const attempt = async (n: number): Promise<void> => {
    try {
      await task()
    } catch (err) {
      if (n < 3) {
        await new Promise((r) => setTimeout(r, 1500 * n))
        return attempt(n + 1)
      }
      console.error("Sync failed", err)
      dirty.add(key)
      window.dispatchEvent(
        new CustomEvent("wedding-sync-error", {
          detail: "Could not reach the server. Your change is saved on this device and will be retried.",
        }),
      )
    }
  }
  void attempt(1).finally(() => {
    pending--
    if (pending === 0) void pullRemote(false)
  })
}

function queueRemote(key: string, previous: unknown, next: unknown) {
  if (!remoteEnabled) return
  const admin = isAdminSession()
  const table = LIST_TABLES[key]
  if (table) {
    const prevList: any[] = Array.isArray(previous) ? previous : []
    const before = new Map<string, string>(prevList.map((x: any) => [x.id, stable(x)]))
    const prevById = new Map<string, any>(prevList.map((x: any) => [x.id, x]))
    const list: any[] = Array.isArray(next) ? next : []
    const upserts = list.filter((x) => before.get(x.id) !== stable(x))
    const present = new Set(list.map((x) => x.id))
    const removed = [...before.keys()].filter((id) => !present.has(id))
    if (upserts.length === 0 && removed.length === 0) return
    if (admin) {
      run(key, async () => {
        await upsertRows(table, upserts.map((x) => toRow(table, x)))
        await deleteRows(table, removed)
      })
    } else {
      run(key, () => guestPush(table, upserts, prevById))
    }
  } else if (key === KEYS.content && admin) {
    run(key, () => upsertRows("site_content", [{ id: "main", data: next }]))
  }
}

/** What a guest (not signed in) is allowed to send: new wishes/photos, hearts, RSVP. */
async function guestPush(table: string, upserts: any[], prevById: Map<string, any>) {
  if (table === "wishes") {
    const fresh = upserts.filter((w) => !prevById.has(w.id))
    await insertRows("wishes", fresh.map((w) => toRow("wishes", w)))
    for (const w of upserts) {
      const old = prevById.get(w.id)
      if (old && w.hearts !== old.hearts) {
        await rpc("heart_wish", { p_id: w.id, p_delta: Math.sign(w.hearts - old.hearts) })
      }
    }
  } else if (table === "moments") {
    const fresh = upserts.filter((m) => !prevById.has(m.id))
    await insertRows("moments", fresh.map((m) => toRow("moments", m)))
  } else if (table === "guests") {
    for (const g of upserts) {
      const old = prevById.get(g.id)
      if (g.respondedAt && g.respondedAt !== old?.respondedAt) {
        await rpc("rsvp_guest", {
          p_code: g.code,
          p_name: g.name,
          p_attending: g.status === "Confirmed",
          p_pax: g.pax,
          p_message: g.message ?? "",
        })
      } else if (g.openedAt && !old?.openedAt) {
        await rpc("open_guest", { p_code: g.code })
      }
    }
  }
}

function applyIfChanged(key: string, value: unknown) {
  if (pending > 0) return
  if (stable(peek(key)) === stable(value)) return
  writeStored(key, value, { fromRemote: true })
}

async function syncList(key: string, table: string, seeded: boolean) {
  const admin = isAdminSession()
  const rows = await selectRows(table)
  const local = peek(key)
  const localList: any[] = Array.isArray(local) ? local : []
  if (admin) {
    if (dirty.has(key) || (rows.length === 0 && localList.length > 0 && !seeded)) {
      await upsertRows(table, localList.map((x) => toRow(table, x)))
      dirty.delete(key)
      return
    }
  } else if (dirty.has(key)) {
    // A guest's earlier send failed: try again with whatever the server does not have yet.
    const known = new Set(rows.map((r) => r.id))
    await insertRows(table, localList.filter((x) => !known.has(x.id)).map((x) => toRow(table, x)))
    dirty.delete(key)
    return
  }
  const items = rows.map((r) => r.data as { createdAt?: number })
  const asc = table === "guests"
  items.sort((a, b) => ((a.createdAt ?? 0) - (b.createdAt ?? 0)) * (asc ? 1 : -1))
  applyIfChanged(key, items)
}

/** A guest only ever receives their own invitation (without the phone number). */
async function syncInvitedGuest() {
  const code = (new URLSearchParams(window.location.search).get("guest") || "").trim()
  if (!code) return
  const guest = await rpc<unknown>("get_guest", { p_code: code })
  if (guest && typeof guest === "object") applyIfChanged(KEYS.guests, [guest])
}

async function syncVisits(seeded: boolean) {
  const rows = await selectRows("visits", { order: "created_at.desc", limit: 2000 })
  const local = peek(KEYS.visits)
  const localList: Visit[] = Array.isArray(local) ? (local as Visit[]) : []
  if (rows.length === 0 && localList.length > 0 && !seeded) {
    await upsertRows("visits", localList.map((v) => ({ id: visitId(v), data: v })))
    return
  }
  const items = rows.map((r) => r.data as Visit).sort((a, b) => a.t - b.t)
  applyIfChanged(KEYS.visits, items)
}

async function syncContent(seeded: boolean) {
  const admin = isAdminSession()
  const rows = await selectRows("site_content")
  const main = rows.find((r) => r.id === "main")
  if (admin && (!main || dirty.has(KEYS.content))) {
    const local = peek(KEYS.content)
    if (local && (dirty.has(KEYS.content) || !seeded)) {
      await upsertRows("site_content", [{ id: "main", data: local }])
      dirty.delete(KEYS.content)
    }
    return
  }
  if (main) applyIfChanged(KEYS.content, main.data)
}

export async function pullRemote(heavy = true): Promise<void> {
  if (!remoteEnabled || pending > 0 || pulling) return
  pulling = true
  try {
    const admin = isAdminSession()
    const seeded = seededAlready()
    const jobs: Promise<void>[] = [syncList(KEYS.wishes, "wishes", seeded)]
    if (admin) {
      jobs.push(syncList(KEYS.guests, "guests", seeded), syncVisits(seeded))
    } else {
      jobs.push(syncInvitedGuest())
    }
    if (heavy) {
      jobs.push(syncList(KEYS.moments, "moments", seeded), syncContent(seeded))
    }
    await Promise.all(jobs)
    if (heavy && admin) markSeeded()
  } catch (err) {
    console.warn("Sync pull failed", err)
  } finally {
    pulling = false
  }
}

/** Called on sign-out so guest phone numbers and statistics do not stay in the browser. */
export function clearPrivateData() {
  for (const key of [KEYS.guests, KEYS.visits]) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    cache.delete(key)
  }
  emit()
}

let syncStarted = false
export function startSync() {
  if (!remoteEnabled || syncStarted || typeof window === "undefined") return
  syncStarted = true
  // Pastikan status login admin ke server dulu, baru tarik data.
  void refreshSession().finally(() => void pullRemote(true))
  let tick = 0
  window.setInterval(() => {
    tick++
    void pullRemote(tick % 4 === 0)
  }, 30000)
  window.addEventListener("focus", () => void pullRemote(false))
}

export function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => readStored(key, fallback),
    () => fallback,
  )
}

/* ------------------------------- content ------------------------------- */

const NO_SAVED: unknown = null

export function useSavedContent(): SiteContent {
  const saved = useStored<unknown>(KEYS.content, NO_SAVED)
  return useMemo(() => mergeContent(saved), [saved])
}

export function getSavedContent(): SiteContent {
  return mergeContent(readStored<unknown>(KEYS.content, NO_SAVED))
}

export function saveContent(content: SiteContent): WriteResult {
  return writeStored(KEYS.content, content)
}

/* -------------------------------- guests -------------------------------- */

export type RsvpStatus = "Pending" | "Confirmed" | "Declined"

export interface Guest {
  id: string
  code: string
  name: string
  phone: string
  category: string
  status: RsvpStatus
  pax: number
  message?: string
  checkedIn: boolean
  checkedInAt?: number
  openedAt?: number
  respondedAt?: number
  createdAt: number
}

export const GUEST_CATEGORIES = ["Family", "Friend", "Colleague", "Other"]

const NO_GUESTS: Guest[] = []

export function useGuests(): Guest[] {
  return useStored<Guest[]>(KEYS.guests, NO_GUESTS)
}

export function getGuests(): Guest[] {
  const list = readStored<Guest[]>(KEYS.guests, NO_GUESTS)
  return Array.isArray(list) ? list : NO_GUESTS
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function randomCode(existing: Set<string>): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  for (let tries = 0; tries < 50; tries++) {
    let code = ""
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    if (!existing.has(code)) return code
  }
  return randomId().toUpperCase().slice(0, 8)
}

/** Invitation links use plain running numbers (1, 2, 3 ...) instead of names. */
function nextCodeNumber(existing: Set<string>): number {
  let max = 0
  for (const code of existing) {
    if (/^\d+$/.test(code)) max = Math.max(max, parseInt(code, 10))
  }
  return max + 1
}

export function saveGuests(list: Guest[]): WriteResult {
  return writeStored(KEYS.guests, list)
}

export interface NewGuest {
  name: string
  phone?: string
  category?: string
  pax?: number
  status?: RsvpStatus
}

export function createGuests(inputs: NewGuest[]): { result: WriteResult; created: Guest[] } {
  const current = getGuests()
  const codes = new Set(current.map((g) => g.code))
  let nextNumber = nextCodeNumber(codes)
  const created: Guest[] = inputs.map((input) => {
    const code = String(nextNumber++)
    codes.add(code)
    return {
      id: randomId(),
      code,
      name: input.name.trim(),
      phone: (input.phone || "").trim(),
      category: input.category || "Other",
      status: input.status || "Pending",
      pax: Math.min(Math.max(Math.round(input.pax || 1), 1), 20),
      checkedIn: false,
      createdAt: Date.now(),
    }
  })
  const result = saveGuests([...current, ...created])
  return { result, created: result.ok ? created : [] }
}

export function updateGuest(id: string, patch: Partial<Guest>): WriteResult {
  return saveGuests(getGuests().map((g) => (g.id === id ? { ...g, ...patch } : g)))
}

export function deleteGuest(id: string): WriteResult {
  return saveGuests(getGuests().filter((g) => g.id !== id))
}

export function setCheckIn(id: string, checkedIn: boolean): WriteResult {
  return updateGuest(id, {
    checkedIn,
    checkedInAt: checkedIn ? Date.now() : undefined,
  })
}

export function findGuestByCode(code: string): Guest | undefined {
  const needle = code.trim().toUpperCase()
  return needle ? getGuests().find((g) => g.code === needle) : undefined
}

export function markOpened(code: string) {
  const guest = findGuestByCode(code)
  if (guest && !guest.openedAt) updateGuest(guest.id, { openedAt: Date.now() })
}

export function submitRsvp(input: {
  name: string
  attending: boolean
  pax: number
  message?: string
  code?: string
}): WriteResult {
  const list = getGuests()
  const name = input.name.trim()
  let target =
    (input.code && list.find((g) => g.code === input.code!.toUpperCase())) ||
    list.find((g) => g.name.trim().toLowerCase() === name.toLowerCase())
  const patch = {
    status: (input.attending ? "Confirmed" : "Declined") as RsvpStatus,
    pax: Math.min(Math.max(input.pax, 1), 20),
    message: input.message?.trim() || undefined,
    respondedAt: Date.now(),
  }
  if (target) {
    const id = target.id
    return saveGuests(list.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }
  const codes = new Set(list.map((g) => g.code))
  target = {
    id: randomId(),
    code: randomCode(codes),
    name,
    phone: "",
    category: "Other",
    checkedIn: false,
    createdAt: Date.now(),
    openedAt: Date.now(),
    ...patch,
  }
  return saveGuests([...list, target])
}

/* -------------------------------- wishes -------------------------------- */

export interface Wish {
  id: string
  name: string
  message: string
  hearts: number
  createdAt: number
}

const NO_WISHES: Wish[] = []

export function useWishes(): Wish[] {
  return useStored<Wish[]>(KEYS.wishes, NO_WISHES)
}

export function addWish(name: string, message: string): WriteResult {
  const list = readStored<Wish[]>(KEYS.wishes, NO_WISHES)
  const wish: Wish = {
    id: randomId(),
    name: name.trim(),
    message: message.trim(),
    hearts: 0,
    createdAt: Date.now(),
  }
  return writeStored(KEYS.wishes, [wish, ...list])
}

export function adjustWishHearts(id: string, delta: number): WriteResult {
  const list = readStored<Wish[]>(KEYS.wishes, NO_WISHES)
  return writeStored(
    KEYS.wishes,
    list.map((w) => (w.id === id ? { ...w, hearts: Math.max(0, w.hearts + delta) } : w)),
  )
}

/* -------------------------------- visits -------------------------------- */

export interface Visit {
  t: number
  device: "mobile" | "desktop"
}

const NO_VISITS: Visit[] = []

export function useVisits(): Visit[] {
  return useStored<Visit[]>(KEYS.visits, NO_VISITS)
}

function visitId(v: Visit): string {
  return `${v.t.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function recordVisit() {
  const list = readStored<Visit[]>(KEYS.visits, NO_VISITS)
  const visit: Visit = {
    t: Date.now(),
    device: window.innerWidth < 768 ? "mobile" : "desktop",
  }
  writeStored(KEYS.visits, [...list, visit].slice(-2000))
  if (remoteEnabled) run(KEYS.visits, () => insertRows("visits", [{ id: visitId(visit), data: visit }]))
}

/* --------------------------------- audio --------------------------------- */

const DB_NAME = "wedding-media"
const STORE = "files"
const AUDIO_KEY = "invitation-audio"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("Could not open media storage."))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = run(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error ?? new Error("Media storage failed."))
      tx.onabort = () => reject(tx.error ?? new Error("Media storage was aborted."))
    })
  } finally {
    db.close()
  }
}

export async function saveAudioBlob(blob: Blob): Promise<unknown> {
  const result = await withStore("readwrite", (s) => s.put(blob, AUDIO_KEY))
  if (remoteEnabled) await uploadMedia(AUDIO_KEY, blob)
  return result
}

export async function deleteAudioBlob(): Promise<unknown> {
  const result = await withStore("readwrite", (s) => s.delete(AUDIO_KEY))
  if (remoteEnabled) await removeMedia(AUDIO_KEY).catch(() => undefined)
  return result
}

export async function loadAudioBlob(): Promise<Blob | null> {
  if (remoteEnabled) {
    try {
      const remote = await fetchMedia(AUDIO_KEY)
      if (remote) return remote
    } catch {
      /* fall back to the local copy */
    }
  }
  try {
    const result = await withStore<unknown>("readonly", (s) => s.get(AUDIO_KEY))
    if (result instanceof Blob) return result
  } catch {
    /* fall through to the bundled song */
  }
  // Default song shipped with the site (public/music/thousand-years.mp3).
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}music/thousand-years.mp3`)
    return res.ok ? await res.blob() : null
  } catch {
    return null
  }
}

/* -------------------------------- uploads -------------------------------- */

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function validateImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `"${file.name}" is not supported. Please choose a PNG, JPG or WebP image.`,
    )
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `"${file.name}" is ${formatBytes(file.size)}. Images must be 5 MB or smaller.`,
    )
  }
}

/**
 * Validate an image and downscale it so it fits comfortably in browser storage.
 * Returns a data URL.
 */
export async function processImage(
  file: File,
  opts: { maxDim: number; quality?: number; keepPng?: boolean },
): Promise<string> {
  validateImage(file)
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error(`"${file.name}" could not be read as an image.`))
      el.src = objectUrl
    })
    const scale = Math.min(1, opts.maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Image processing is not available in this browser.")
    const png = !!opts.keepPng && file.type === "image/png"
    if (!png) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL(png ? "image/png" : "image/jpeg", opts.quality ?? 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function validateAudio(file: File) {
  const name = file.name.toLowerCase()
  const okType = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"].includes(
    file.type,
  )
  const okExt = name.endsWith(".mp3") || name.endsWith(".wav")
  if (!okType && !okExt) {
    throw new Error(`"${file.name}" is not supported. Please choose an MP3 or WAV file.`)
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(`"${file.name}" is ${formatBytes(file.size)}. Audio must be 15 MB or smaller.`)
  }
}

/* ------------------------------- moments ------------------------------- */
/* Photos shared by guests through the "Share Your Moment" button. */

export interface Moment {
  id: string
  src: string
  name: string
  createdAt: number
}

const NO_MOMENTS: Moment[] = []

export function useMoments(): Moment[] {
  return useStored<Moment[]>(KEYS.moments, NO_MOMENTS)
}

export async function addMoments(
  files: File[],
  name: string,
): Promise<{ added: number; error?: string }> {
  const fresh: Moment[] = []
  let error: string | undefined
  for (const file of files.slice(0, 6)) {
    try {
      const src = await processImage(file, { maxDim: 1100, quality: 0.72 })
      fresh.push({ id: randomId(), src, name: name.trim() || "Guest", createdAt: Date.now() })
    } catch (err) {
      error = err instanceof Error ? err.message : "That photo could not be added."
    }
  }
  if (fresh.length === 0) return { added: 0, error }
  const list = readStored<Moment[]>(KEYS.moments, NO_MOMENTS)
  const result = writeStored(KEYS.moments, [...fresh, ...list])
  if (!result.ok) return { added: 0, error: result.error }
  return { added: fresh.length, error }
}
