import { useMemo, useSyncExternalStore } from "react"
import { mergeContent, type SiteContent } from "./content"

/* ------------------------------------------------------------------ *
 * Persistence layer.
 * - Structured data (content, guests, wishes, visits) lives in localStorage
 *   so it survives reloads and is shared with the live-preview iframe
 *   (same origin) through the `storage` event.
 * - The uploaded audio file is too large for localStorage, so it is kept
 *   in IndexedDB.
 * Everything is stored in the visitor's own browser; there is no server.
 * ------------------------------------------------------------------ */

export const KEYS = {
  content: "wedding.content.v1",
  guests: "wedding.guests.v1",
  wishes: "wedding.wishes.v1",
  visits: "wedding.visits.v1",
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

export function writeStored(key: string, value: unknown): WriteResult {
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
  return { ok: true }
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
  const created: Guest[] = inputs.map((input) => {
    const code = randomCode(codes)
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

export function recordVisit() {
  const list = readStored<Visit[]>(KEYS.visits, NO_VISITS)
  const visit: Visit = {
    t: Date.now(),
    device: window.innerWidth < 768 ? "mobile" : "desktop",
  }
  writeStored(KEYS.visits, [...list, visit].slice(-2000))
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

export function saveAudioBlob(blob: Blob): Promise<unknown> {
  return withStore("readwrite", (s) => s.put(blob, AUDIO_KEY))
}

export function deleteAudioBlob(): Promise<unknown> {
  return withStore("readwrite", (s) => s.delete(AUDIO_KEY))
}

export async function loadAudioBlob(): Promise<Blob | null> {
  try {
    const result = await withStore<unknown>("readonly", (s) => s.get(AUDIO_KEY))
    return result instanceof Blob ? result : null
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
