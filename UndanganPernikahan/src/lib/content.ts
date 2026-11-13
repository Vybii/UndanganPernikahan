import brideAmira from "../assets/bride-amira.png"
import groomReza from "../assets/groom-reza.png"
import preweddingPortrait from "../assets/prewedding-portrait.png"
import preweddingTogether from "../assets/prewedding-together.png"
import preweddingStaircase from "../assets/prewedding-staircase.png"
import preweddingHandInHand from "../assets/prewedding-hand-in-hand.png"
import preweddingCover from "../assets/prewedding-cover.png"
import ringsPhoto from "../assets/rings.webp"
import bouquetPhoto from "../assets/bouquet.webp"
import venueFlorals from "../assets/venue-florals.webp"
import guestTable from "../assets/guest-table.webp"
import tableDetail from "../assets/table-detail.webp"

/**
 * Bundled images are referenced as "asset:<name>" inside saved content so the
 * stored JSON never contains build-hashed file paths.
 */
const ASSETS: Record<string, string> = {
  "bride-amira": brideAmira,
  "groom-reza": groomReza,
  "prewedding-portrait": preweddingPortrait,
  "prewedding-together": preweddingTogether,
  "prewedding-staircase": preweddingStaircase,
  "prewedding-hand-in-hand": preweddingHandInHand,
  "prewedding-cover": preweddingCover,
  rings: ringsPhoto,
  bouquet: bouquetPhoto,
  "venue-florals": venueFlorals,
  "guest-table": guestTable,
  "table-detail": tableDetail,
}

export function resolveSrc(src?: string | null): string {
  if (!src) return ""
  if (src.startsWith("asset:")) return ASSETS[src.slice(6)] ?? ""
  return src
}

export type GalleryLayout = "editorial" | "masonry" | "grid"
export type Timezone = "WIB" | "WITA" | "WIT"

export interface GalleryPhoto {
  id: string
  src: string
  label: string
  /** Real photographs get the polaroid treatment in the editorial layout. */
  real: boolean
}

export interface SiteContent {
  couple: {
    brideName: string
    brideNick: string
    groomName: string
    groomNick: string
    brideDesc: string
    groomDesc: string
    brideInstagram: string
    groomInstagram: string
    brideParents: string
    groomParents: string
    bridePhoto: string
    groomPhoto: string
  }
  details: {
    date: string
    timezone: Timezone
    ceremonyStart: string
    ceremonyEnd: string
    receptionStart: string
    receptionEnd: string
    venueName: string
    city: string
    address: string
    mapsLink: string
  }
  gallery: {
    layout: GalleryLayout
    photos: GalleryPhoto[]
  }
  gift: {
    heading: string
    message: string
    bankName: string
    accountNumber: string
    accountHolder: string
    walletProvider: string
    walletNumber: string
    walletHolder: string
    qris: string
  }
  music: {
    title: string
    artist: string
    artwork: string
    hasAudio: boolean
    audioName: string
    autoplay: boolean
    loop: boolean
    volume: number
  }
}

export const DEFAULT_CONTENT: SiteContent = {
  couple: {
    brideName: "Ayu Syafni Zuriyanti",
    brideNick: "Ayu",
    groomName: "Kahijina Minda Angga Kusuma",
    groomNick: "Angga",
    brideDesc: "In your love, I found the quiet joy of home.",
    groomDesc: "With you, every tomorrow becomes a promise.",
    brideInstagram: "",
    groomInstagram: "",
    brideParents: "Mr. Hendra & Mrs. Dewi Kusuma",
    groomParents: "Mr. Wahyu & Mrs. Rina Firmansyah",
    bridePhoto: "asset:bride-amira",
    groomPhoto: "asset:groom-reza",
  },
  details: {
    date: "2028-11-16",
    timezone: "WIB",
    ceremonyStart: "09:00",
    ceremonyEnd: "11:00",
    receptionStart: "12:00",
    receptionEnd: "17:00",
    venueName: "The Premier Hotel Pekanbaru",
    city: "Pekanbaru, Riau",
    address: "Jl. Jend. Sudirman No. 389, Pekanbaru, Riau 28116",
    mapsLink: "",
  },
  gallery: {
    layout: "editorial",
    photos: [
      { id: "g1", src: "asset:prewedding-together", label: "Angga and Ayu", real: true },
      { id: "g2", src: "asset:rings", label: "Wedding rings", real: false },
      { id: "g3", src: "asset:prewedding-portrait", label: "Angga and Ayu together", real: true },
      { id: "g4", src: "asset:bouquet", label: "Wedding bouquet", real: false },
      { id: "g5", src: "asset:prewedding-staircase", label: "Pre-wedding portrait on the staircase", real: true },
      { id: "g6", src: "asset:venue-florals", label: "Floral arrangement at the wedding venue", real: false },
      { id: "g7", src: "asset:prewedding-hand-in-hand", label: "Angga and Ayu walking hand in hand", real: true },
      { id: "g8", src: "asset:guest-table", label: "Guest table place setting at the venue", real: false },
      { id: "g9", src: "asset:table-detail", label: "Glassware and floral table details", real: false },
    ],
  },
  gift: {
    heading: "Send a Gift",
    message: "Your presence is the greatest gift. But if you wish to give more…",
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "Kahijina Minda Angga Kusuma",
    walletProvider: "GoPay",
    walletNumber: "+62 812 3456 7890",
    walletHolder: "Ayu Syafni Zuriyanti",
    qris: "",
  },
  music: {
    title: "A Thousand Years",
    artist: "Christina Perri",
    artwork: "asset:prewedding-cover",
    hasAudio: true,
    audioName: "Thousand years.mp3",
    autoplay: true,
    loop: true,
    volume: 55,
  },
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

/** Merge persisted (possibly partial or outdated) content over the defaults. */
export function mergeContent(saved: unknown): SiteContent {
  const s = (saved && typeof saved === "object" ? saved : {}) as Record<string, any>
  const d = DEFAULT_CONTENT
  const pick = <T extends Record<string, any>>(def: T, src: any): T => {
    const out: Record<string, any> = { ...def }
    if (src && typeof src === "object") {
      for (const key of Object.keys(def)) {
        const v = src[key]
        if (typeof def[key] === "string" && typeof v === "string") out[key] = v
        else if (typeof def[key] === "boolean" && typeof v === "boolean") out[key] = v
        else if (typeof def[key] === "number" && typeof v === "number") out[key] = v
      }
    }
    return out as T
  }
  const gallery = pick({ layout: d.gallery.layout as string }, s.gallery)
  const layout: GalleryLayout = ["editorial", "masonry", "grid"].includes(gallery.layout)
    ? (gallery.layout as GalleryLayout)
    : "editorial"
  const photos: GalleryPhoto[] = Array.isArray(s.gallery?.photos)
    ? s.gallery.photos
        .filter((p: any) => p && typeof p.src === "string" && p.src)
        .map((p: any, i: number) => ({
          id: str(p.id, `p${i}`),
          src: p.src,
          label: str(p.label, "Gallery photo"),
          real: bool(p.real, true),
        }))
    : d.gallery.photos
  const details = pick(d.details, s.details)
  if (!["WIB", "WITA", "WIT"].includes(details.timezone)) details.timezone = "WIB"
  return {
    couple: pick(d.couple, s.couple),
    details,
    gallery: { layout, photos },
    gift: pick(d.gift, s.gift),
    music: pick(d.music, s.music),
  }
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function parseDate(date: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  return { y: +match[1], m: +match[2], d: +match[3] }
}

export function formatDateLong(date: string): string {
  const p = parseDate(date)
  if (!p) return ""
  const weekday = WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()]
  return `${weekday}, ${p.d} ${MONTHS[p.m - 1]} ${p.y}`
}

export function formatDateMedium(date: string): string {
  const p = parseDate(date)
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : ""
}

export function formatDateDotted(date: string): string {
  const p = parseDate(date)
  return p ? `${p.d} · ${String(p.m).padStart(2, "0")} · ${p.y}` : ""
}

const TZ_OFFSET: Record<Timezone, string> = { WIB: "+07:00", WITA: "+08:00", WIT: "+09:00" }

/** Absolute moment for a local wall-clock time on the wedding date. */
export function weddingMoment(d: SiteContent["details"], time: string): Date {
  const iso = `${d.date}T${/^\d{2}:\d{2}$/.test(time) ? time : "00:00"}:00${TZ_OFFSET[d.timezone]}`
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed
}

export function timeRange(start: string, end: string, tz: Timezone): string {
  if (!start) return ""
  return `${start}${end ? ` – ${end}` : ""} ${tz}`
}

export function calendarUrl(c: SiteContent): string {
  const { details, couple } = c
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const start = weddingMoment(details, details.ceremonyStart)
  const end = weddingMoment(details, details.receptionEnd || details.receptionStart || details.ceremonyEnd)
  const params: Record<string, string> = {
    action: "TEMPLATE",
    text: `The Wedding of ${couple.groomNick} & ${couple.brideNick}`,
    location: `${details.venueName}, ${details.city}`,
    details: `Akad Nikah: ${timeRange(details.ceremonyStart, details.ceremonyEnd, details.timezone)}. Reception: ${timeRange(details.receptionStart, details.receptionEnd, details.timezone)}.`,
  }
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    params.dates = `${fmt(start)}/${fmt(end.getTime() > start.getTime() ? end : new Date(start.getTime() + 3600000))}`
  }
  return `https://calendar.google.com/calendar/render?${new URLSearchParams(params)}`
}

export function mapsEmbedUrl(d: SiteContent["details"]): string {
  const q = [d.venueName, d.address].filter(Boolean).join(", ")
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`
}

export function mapsOpenUrl(d: SiteContent["details"]): string {
  if (/^https?:\/\//i.test(d.mapsLink.trim())) return d.mapsLink.trim()
  const q = [d.venueName, d.city].filter(Boolean).join(", ")
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function initialOf(name: string): string {
  return (name.trim()[0] || "").toUpperCase()
}
