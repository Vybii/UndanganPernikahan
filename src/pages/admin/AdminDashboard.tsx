import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router"
import QRCode from "qrcode"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import CmsEditorWorkspace from "./CmsEditorWorkspace"
import { formatDateLong, weddingMoment } from "../../lib/content"
import {
  GUEST_CATEGORIES,
  KEYS,
  createGuests,
  deleteGuest,
  findGuestByCode,
  setCheckIn,
  updateGuest,
  useGuests,
  useSavedContent,
  useStored,
  useVisits,
  useWishes,
  type Guest,
  type RsvpStatus,
} from "../../lib/store"
import { copyText, useToast } from "../../lib/ui"

const GOLD = "#b8965a"
const SAGE = "#7a9e7e"

const navItems = [
  { id: "overview", label: "Overview", icon: "◆" },
  { id: "guests", label: "Guest Management", icon: "◇" },
  { id: "rsvp", label: "RSVP Management", icon: "✉" },
  { id: "invitations", label: "Invitation Links", icon: "⌁" },
  { id: "checkin", label: "QR Check-in", icon: "◉" },
  { id: "analytics", label: "Analytics", icon: "◈" },
  { id: "editor", label: "CMS Editor", icon: "✎" },
]

const themes = [
  { name: "Elegant Gold", colors: ["#b8965a", "#f5ecd8", "#2c2118"] },
  { name: "Garden Romance", colors: ["#7a9e7e", "#f0f4ef", "#2d3c2e"] },
  { name: "Minimal White", colors: ["#e0d8cc", "#ffffff", "#333333"] },
  { name: "Traditional Luxury", colors: ["#8b0000", "#fdf5e6", "#2c1a00"] },
]

const DAY = 86400000

function guestLink(code: string): string {
  const base = import.meta.env.BASE_URL
  const root = /^https?:\/\//i.test(base) ? base : `${window.location.origin}${base}`
  return `${root}${root.endsWith("/") ? "" : "/"}?guest=${code}`
}

function relativeTime(at: number): string {
  const diff = Math.max(0, Date.now() - at)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""}`
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  )
}

function whatsappUrl(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, "")
  if (digits.length < 8) return null
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string
  value: string
  change?: string
  icon: string
}) {
  return (
    <div className="admin-stat-card p-6 rounded-2xl transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="text-2xl" style={{ color: GOLD }}>
          {icon}
        </div>
        {change && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: "rgba(122,158,126,0.15)", color: SAGE }}
          >
            {change}
          </span>
        )}
      </div>
      <div
        className="text-3xl font-bold mb-1"
        style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
      >
        {value}
      </div>
      <div
        className="text-xs tracking-wide uppercase"
        style={{ color: "#ad9a80" }}
      >
        {label}
      </div>
    </div>
  )
}

function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="admin-empty">
      <strong>{title}</strong>
      {children}
    </div>
  )
}

function QrImage({ text, size = 52 }: { text: string; size?: number }) {
  const [src, setSrc] = useState("")
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(text, { margin: 1, width: size * 3, errorCorrectionLevel: "M" })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(""))
    return () => {
      alive = false
    }
  }, [text, size])
  if (!src) return <div className="admin-qr-thumb" style={{ width: size, height: size }} />
  return (
    <img
      className="admin-qr-thumb"
      style={{ width: size, height: size }}
      src={src}
      alt="Guest QR code"
    />
  )
}

const goldButton = {
  background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`,
  color: "#fff",
  borderRadius: "8px",
}

const quietButton = {
  background: "rgba(60, 41, 31, 0.9)",
  color: "#d9c5a7",
  borderRadius: "8px",
  border: "1px solid rgba(204,163,96,0.3)",
}

const inputStyle = {
  background: "#faf8f5",
  border: "1px solid #e0d8cc",
  borderRadius: "8px",
  color: "#f0e3cf",
  fontFamily: "Outfit, sans-serif",
}

function GuestModal({
  guest,
  onClose,
  onSaved,
  notify,
}: {
  guest: Guest | null
  onClose: () => void
  onSaved: () => void
  notify: (message: string, kind?: "success" | "error") => void
}) {
  const [name, setName] = useState(guest?.name ?? "")
  const [phone, setPhone] = useState(guest?.phone ?? "")
  const [category, setCategory] = useState(guest?.category ?? "Family")
  const [pax, setPax] = useState(guest?.pax ?? 1)
  const [status, setStatus] = useState<RsvpStatus>(guest?.status ?? "Pending")
  const [error, setError] = useState("")
  const categories = GUEST_CATEGORIES.includes(category) ? GUEST_CATEGORIES : [...GUEST_CATEGORIES, category]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Guest name is required.")
      return
    }
    if (phone.trim() && phone.replace(/[^\d+]/g, "").length < 8) {
      setError("Please enter a valid phone number, or leave it empty.")
      return
    }
    if (guest) {
      const result = updateGuest(guest.id, {
        name: trimmed,
        phone: phone.trim(),
        category,
        pax,
        status,
        respondedAt: status === guest.status ? guest.respondedAt : status === "Pending" ? undefined : Date.now(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      notify("Guest updated.")
    } else {
      const { result } = createGuests([{ name: trimmed, phone, category, pax, status }])
      if (!result.ok) {
        setError(result.error)
        return
      }
      notify(`${trimmed} was added to the guest list.`)
    }
    onSaved()
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <form
        className="admin-modal space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={guest ? "Edit guest" : "Add guest"}
      >
        <h3 className="text-lg" style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}>
          {guest ? "Edit guest" : "Add guest"}
        </h3>
        {error && (
          <div role="alert" className="p-3 rounded-lg text-xs" style={{ background: "rgba(220,80,80,0.15)", color: "#f08080", border: "1px solid rgba(220,80,80,0.3)" }}>
            {error}
          </div>
        )}
        <div>
          <label htmlFor="guest-name">Guest name</label>
          <input id="guest-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="guest-phone">Phone (optional)</label>
          <input id="guest-phone" value={phone} placeholder="+62 812 3456 7890" onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="guest-category">Category</label>
            <select id="guest-category" className="browser-default" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="guest-pax">Number of guests</label>
            <input id="guest-pax" type="number" min={1} max={20} value={pax} onChange={(e) => setPax(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} style={inputStyle} />
          </div>
        </div>
        {guest && (
          <div>
            <label htmlFor="guest-status">RSVP status</label>
            <select id="guest-status" className="browser-default" value={status} onChange={(e) => setStatus(e.target.value as RsvpStatus)} style={inputStyle}>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Declined</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs" style={quietButton}>
            Cancel
          </button>
          <button type="submit" className="btn waves-effect px-4 py-2 text-xs tracking-wide" style={goldButton}>
            {guest ? "Save changes" : "Add guest"}
          </button>
        </div>
      </form>
    </div>
  )
}

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

function CheckinPanel({
  guests,
  notify,
}: {
  guests: Guest[]
  notify: (message: string, kind?: "success" | "error") => void
}) {
  const [code, setCode] = useState("")
  const [search, setSearch] = useState("")
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const guestsRef = useRef(guests)
  guestsRef.current = guests

  const total = guests.length
  const checkedIn = guests.filter((g) => g.checkedIn)
  const recent = [...checkedIn].sort((a, b) => (b.checkedInAt ?? 0) - (a.checkedInAt ?? 0))

  const checkInGuest = (guest: Guest) => {
    if (guest.checkedIn) {
      notify(`${guest.name} is already checked in.`, "error")
      return
    }
    const result = setCheckIn(guest.id, true)
    if (result.ok) notify(`${guest.name} checked in.`)
    else notify(result.error, "error")
  }

  const resolveCode = (raw: string): Guest | undefined => {
    let value = raw.trim()
    try {
      const fromUrl = new URL(value).searchParams.get("guest")
      if (fromUrl) value = fromUrl
    } catch {
      /* plain code */
    }
    return findGuestByCode(value)
  }

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    const guest = resolveCode(code)
    if (!guest) {
      notify("No guest matches that code. Check the code and try again.", "error")
      return
    }
    checkInGuest(guest)
    setCode("")
  }

  useEffect(() => {
    if (!scanning) return
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      notify("Camera scanning is not supported in this browser. Enter the guest code manually instead.", "error")
      setScanning(false)
      return
    }
    let stream: MediaStream | null = null
    let timer: number | undefined
    let cancelled = false
    let lastHit = 0
    const detector = new Detector({ formats: ["qr_code"] })
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        void video.play()
        timer = window.setInterval(async () => {
          if (!videoRef.current || Date.now() - lastHit < 2500) return
          try {
            const found = await detector.detect(videoRef.current)
            if (!found.length) return
            lastHit = Date.now()
            let value = found[0].rawValue
            try {
              const fromUrl = new URL(value).searchParams.get("guest")
              if (fromUrl) value = fromUrl
            } catch {
              /* plain code */
            }
            const guest = findGuestByCode(value)
            if (!guest) notify("This QR code does not belong to a guest on your list.", "error")
            else if (guest.checkedIn) notify(`${guest.name} is already checked in.`, "error")
            else {
              const result = setCheckIn(guest.id, true)
              notify(result.ok ? `${guest.name} checked in.` : result.error, result.ok ? "success" : "error")
            }
          } catch {
            /* ignore single-frame failures */
          }
        }, 400)
      })
      .catch(() => {
        notify("Camera access was blocked or no camera was found. Enter the guest code manually instead.", "error")
        setScanning(false)
      })
    return () => {
      cancelled = true
      window.clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  const matches = guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Total Guests" value={String(total)} icon="◆" />
        <StatCard label="Checked In" value={String(checkedIn.length)} change={total ? `${pct(checkedIn.length, total)}%` : undefined} icon="◉" />
        <StatCard label="Remaining" value={String(total - checkedIn.length)} icon="◇" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl text-center" style={{ background: "#fff", border: "1px solid #e0d8cc" }}>
          <h3 className="text-lg mb-6" style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}>
            QR Scanner
          </h3>
          <div
            className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
            style={{ background: "#f0ebe3", border: "2px dashed #b8965a" }}
          >
            {scanning ? (
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2" style={{ color: GOLD }}>
                  ◎
                </div>
                <div className="text-xs" style={{ color: "#ad9a80" }}>
                  Point camera at QR
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScanning((s) => !s)}
            disabled={total === 0}
            className="btn waves-effect px-8 py-3 text-sm tracking-wide transition-all hover:opacity-90"
            style={{ ...goldButton, opacity: total === 0 ? 0.5 : 1 }}
          >
            {scanning ? "Stop Scanning" : "Start Scanning"}
          </button>
          <form onSubmit={submitCode} className="flex gap-2 mt-5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Or enter guest code / link"
              aria-label="Guest code"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <button type="submit" disabled={total === 0} className="px-4 py-2 text-xs" style={quietButton}>
              Check in
            </button>
          </form>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: "#fff", border: "1px solid #e0d8cc" }}>
          <h3 className="text-lg mb-4" style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}>
            Recent Check-ins
          </h3>
          {recent.length === 0 ? (
            <EmptyState title="No check-ins yet">Guests appear here as they arrive.</EmptyState>
          ) : (
            <div className="space-y-3">
              {recent.slice(0, 8).map((g) => (
                <div key={g.id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f5f0ea" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#f0e3cf" }}>
                      {g.name}
                    </div>
                    <div className="text-xs" style={{ color: "#ad9a80" }}>
                      {g.category}
                      {g.checkedInAt ? ` · ${relativeTime(g.checkedInAt) === "Just now" ? "Just now" : `${relativeTime(g.checkedInAt)} ago`}` : ""}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(122,158,126,0.15)", color: SAGE }}>
                    ✓ Arrived
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e0d8cc" }}>
        <div className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-base" style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}>
            Manual check-in
          </h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="px-4 py-2 text-sm outline-none"
            style={{ ...inputStyle, width: "220px" }}
          />
        </div>
        {total === 0 ? (
          <EmptyState title="No guests to check in">Add guests in Guest Management first.</EmptyState>
        ) : matches.length === 0 ? (
          <EmptyState title="No guests match your search" />
        ) : (
          <div className="overflow-x-auto">
            <table className="highlight w-full text-sm">
              <tbody>
                {matches.map((g) => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #f5f0ea" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#f0e3cf" }}>
                      {g.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#ad9a80" }}>
                      {g.category}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: g.checkedIn ? SAGE : "#ad9a80" }}>
                      {g.checkedIn ? "✓ Checked In" : "○ Not Yet"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded"
                        style={{ color: g.checkedIn ? "#d9c5a7" : GOLD, border: `1px solid ${g.checkedIn ? "#e0d8cc" : GOLD}` }}
                        onClick={() => {
                          if (g.checkedIn) {
                            const result = setCheckIn(g.id, false)
                            notify(result.ok ? `Check-in undone for ${g.name}.` : result.error, result.ok ? "success" : "error")
                          } else checkInGuest(g)
                        }}
                      >
                        {g.checkedIn ? "Undo" : "Check in"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function parseCsv(text: string): { name: string; phone: string; category: string }[] {
  const rows: { name: string; phone: string; category: string }[] = []
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim())
  lines.forEach((line, index) => {
    const delimiter = line.includes(";") && !line.includes(",") ? ";" : ","
    const cells = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, "").trim())
    if (index === 0 && /^(name|nama|guest)/i.test(cells[0])) return
    if (!cells[0]) return
    const rawCategory = cells[2] || ""
    const category = GUEST_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) || (rawCategory ? rawCategory : "Other")
    rows.push({ name: cells[0], phone: cells[1] || "", category })
  })
  return rows
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { section } = useParams()
  const requested = section || "overview"
  const [activeSection, setActiveSection] = useState(
    navItems.some((n) => n.id === requested) || requested === "theme" ? requested : "overview",
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [selectedTheme, setSelectedTheme] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modal, setModal] = useState<{ guest: Guest | null } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Guest | null>(null)
  const [linkName, setLinkName] = useState("")
  const csvInput = useRef<HTMLInputElement>(null)
  const { show, node: toastNode } = useToast()

  const content = useSavedContent()
  const savedRaw = useStored<unknown>(KEYS.content, null)
  const guests = useGuests()
  const visits = useVisits()
  const wishes = useWishes()

  const names = `${content.couple.groomNick} & ${content.couple.brideNick}`
  const dateLong = formatDateLong(content.details.date)
  const targetMs = weddingMoment(content.details, content.details.ceremonyStart).getTime()
  const daysRemaining = Number.isNaN(targetMs) ? 0 : Math.max(0, Math.ceil((targetMs - Date.now()) / DAY))

  const stats = useMemo(() => {
    const confirmed = guests.filter((g) => g.status === "Confirmed")
    const pending = guests.filter((g) => g.status === "Pending")
    const declined = guests.filter((g) => g.status === "Declined")
    const opened = guests.filter((g) => g.openedAt)
    const checkedIn = guests.filter((g) => g.checkedIn)
    const headcount = (list: Guest[]) => list.reduce((sum, g) => sum + g.pax, 0)
    return { confirmed, pending, declined, opened, checkedIn, headcount, total: guests.length }
  }, [guests])

  const rsvpData = [
    { name: "Confirmed", value: stats.confirmed.length, color: GOLD },
    { name: "Pending", value: stats.pending.length, color: "#c8b090" },
    { name: "Declined", value: stats.declined.length, color: "#d4c4b0" },
  ]

  const weekData = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = startOfToday.getTime() - (6 - i) * DAY
      const dayEnd = dayStart + DAY
      return {
        day: new Date(dayStart).toLocaleDateString("en-US", { weekday: "short" }),
        visits: visits.filter((v) => v.t >= dayStart && v.t < dayEnd).length,
        rsvp: guests.filter((g) => g.respondedAt && g.respondedAt >= dayStart && g.respondedAt < dayEnd).length,
      }
    })
  }, [visits, guests])

  const activityItems = useMemo(() => {
    const items: { key: string; at: number; initials: string; title: string; detail: string }[] = []
    guests.forEach((g) => {
      if (g.respondedAt && g.status !== "Pending") {
        items.push({
          key: `${g.id}-rsvp`,
          at: g.respondedAt,
          initials: initialsOf(g.name),
          title: `${g.name} ${g.status === "Confirmed" ? "confirmed attendance" : "declined the invitation"}`,
          detail: `${g.pax} guest${g.pax > 1 ? "s" : ""} · ${g.category}`,
        })
      }
      if (g.openedAt) {
        items.push({ key: `${g.id}-open`, at: g.openedAt, initials: initialsOf(g.name), title: `${g.name} opened the invitation`, detail: "Personal link" })
      }
      if (g.checkedInAt) {
        items.push({ key: `${g.id}-in`, at: g.checkedInAt, initials: initialsOf(g.name), title: `${g.name} checked in`, detail: "QR Check-in" })
      }
    })
    wishes.forEach((w) =>
      items.push({ key: `w-${w.id}`, at: w.createdAt, initials: initialsOf(w.name), title: `${w.name} left a wedding wish`, detail: "Guestbook" }),
    )
    return items.sort((a, b) => b.at - a.at).slice(0, 6)
  }, [guests, wishes])

  const checklist = [
    { label: "Add your guest list", done: stats.total > 0, note: stats.total > 0 ? "Completed" : "Not started" },
    { label: "Customize the invitation in the CMS", done: savedRaw !== null, note: savedRaw !== null ? "Completed" : "Using default content" },
    { label: "Upload invitation music", done: content.music.hasAudio, note: content.music.hasAudio ? "Completed" : "No song uploaded" },
    {
      label: "Follow up on pending RSVPs",
      done: stats.total > 0 && stats.pending.length === 0,
      note: stats.total === 0 ? "Add guests first" : stats.pending.length === 0 ? "Completed" : `${stats.pending.length} pending`,
    },
  ]

  const categories = useMemo(() => {
    const set = new Set<string>(GUEST_CATEGORIES)
    guests.forEach((g) => set.add(g.category))
    return ["All", ...Array.from(set)]
  }, [guests])

  const filteredGuests = guests.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterCategory === "All" || g.category === filterCategory
    return matchSearch && matchFilter
  })

  const copyLink = async (guest: Guest) => {
    const ok = await copyText(guestLink(guest.code))
    show(ok ? `Link for ${guest.name} copied.` : `Could not copy automatically. Link: ${guestLink(guest.code)}`, ok ? "success" : "error")
  }

  const handleCsv = async (file: File) => {
    if (!/\.(csv|txt)$/i.test(file.name) && !file.type.includes("csv") && file.type !== "text/plain") {
      show(`"${file.name}" is not supported. Please choose a .csv file.`, "error")
      return
    }
    if (file.size > 1024 * 1024) {
      show("That file is larger than 1 MB. Split it into smaller files.", "error")
      return
    }
    let rows
    try {
      rows = parseCsv(await file.text())
    } catch {
      show("The file could not be read.", "error")
      return
    }
    if (rows.length === 0) {
      show("No guests found. Use columns: name, phone, category.", "error")
      return
    }
    const known = new Set(guests.map((g) => g.name.trim().toLowerCase()))
    const fresh = rows.filter((r) => {
      const key = r.name.toLowerCase()
      if (known.has(key)) return false
      known.add(key)
      return true
    })
    if (fresh.length === 0) {
      show("All guests in that file are already on your list.", "error")
      return
    }
    const { result } = createGuests(fresh)
    if (!result.ok) {
      show(result.error, "error")
      return
    }
    const skipped = rows.length - fresh.length
    show(`Imported ${fresh.length} guest${fresh.length > 1 ? "s" : ""}${skipped ? ` (${skipped} duplicate${skipped > 1 ? "s" : ""} skipped)` : ""}.`)
  }

  const generateLink = (e: React.FormEvent) => {
    e.preventDefault()
    const name = linkName.trim()
    if (!name) {
      show("Enter a guest name first.", "error")
      return
    }
    const existing = guests.find((g) => g.name.trim().toLowerCase() === name.toLowerCase())
    if (existing) {
      void copyLink(existing)
      return
    }
    const { result, created } = createGuests([{ name }])
    if (!result.ok) {
      show(result.error, "error")
      return
    }
    setLinkName("")
    void copyText(guestLink(created[0].code))
    show(`Link created for ${name} and copied to the clipboard.`)
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-5">
            <section className="admin-welcome-card">
              <div className="relative z-10 max-w-xl">
                <div
                  className="text-xs tracking-[0.3em] uppercase mb-3"
                  style={{ color: "#d4b67f" }}
                >
                  Wedding command center
                </div>
                <h2
                  className="text-3xl md:text-4xl mb-3"
                  style={{ color: "#fff8ec" }}
                >
                  Welcome back, {names}
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(245,236,216,0.7)" }}
                >
                  Here is a live summary of your guest list, RSVPs and invitation
                  activity.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => setActiveSection("guests")}
                    className="px-4 py-2.5 rounded-lg text-xs tracking-wide"
                    style={{ background: "#c9a568", color: "#241a13" }}
                  >
                    Manage guest list
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2.5 rounded-lg text-xs tracking-wide"
                    style={{
                      color: "#ead9bd",
                      border: "1px solid rgba(218,185,128,0.4)",
                    }}
                  >
                    Preview invitation
                  </button>
                </div>
              </div>
              <div className="admin-countdown">
                <div
                  className="text-xs tracking-[0.25em] uppercase"
                  style={{ color: "#c9a568" }}
                >
                  Until “I do”
                </div>
                <div
                  className="text-5xl md:text-6xl my-2"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#fff8ec",
                  }}
                >
                  {daysRemaining}
                </div>
                <div
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,236,216,0.55)" }}
                >
                  days remaining
                </div>
                <div className="admin-countdown-line">
                  <span />
                </div>
                <div
                  className="text-xs"
                  style={{ color: "rgba(245,236,216,0.7)" }}
                >
                  {dateLong}
                </div>
              </div>
            </section>

            <div className="row">
              <div className="col s6 l3">
                <StatCard
                  label="Total Guests"
                  value={String(stats.total)}
                  icon="◆"
                />
              </div>
              <div className="col s6 l3">
                <StatCard
                  label="Invitation Opened"
                  value={String(stats.opened.length)}
                  icon="✉"
                />
              </div>
              <div className="col s6 l3">
                <StatCard
                  label="Confirmed RSVP"
                  value={String(stats.confirmed.length)}
                  icon="✓"
                />
              </div>
              <div className="col s6 l3">
                <StatCard
                  label="Checked In"
                  value={String(stats.checkedIn.length)}
                  icon="◉"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 admin-panel p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div
                      className="text-xs tracking-[0.18em] uppercase mb-1"
                      style={{ color: GOLD }}
                    >
                      Guest response
                    </div>
                    <h3
                      className="text-lg"
                      style={{
                        fontFamily: "Playfair Display, serif",
                        color: "#f0e3cf",
                      }}
                    >
                      Invitation & RSVP momentum
                    </h3>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "#f4efe7", color: "#6d5a45" }}
                  >
                    Last 7 days
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rsvpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SAGE} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={SAGE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#ad9a80" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, (max: number) => Math.max(max, 4)]}
                      tick={{ fontSize: 11, fill: "#ad9a80" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: `1px solid ${GOLD}`,
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke={GOLD}
                      strokeWidth={2}
                      fill="url(#visits)"
                      name="Visits"
                    />
                    <Area
                      type="monotone"
                      dataKey="rsvp"
                      stroke={SAGE}
                      strokeWidth={2}
                      fill="url(#rsvpGrad)"
                      name="RSVP"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="admin-panel p-6 rounded-2xl">
                <div
                  className="text-xs tracking-[0.18em] uppercase mb-1"
                  style={{ color: GOLD }}
                >
                  Attendance
                </div>
                <h3
                  className="text-lg mb-4"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#f0e3cf",
                  }}
                >
                  RSVP status
                </h3>
                {stats.total > 0 ? (
<ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={rsvpData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {rsvpData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v} guests`]}
                      contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
) : (
<EmptyState title="No RSVP data yet">Add guests to see responses here.</EmptyState>
)}
                <div className="space-y-2 mt-2">
                  {rsvpData.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span style={{ color: "#d9c5a7" }}>{item.name}</span>
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: "#f0e3cf" }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 admin-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div
                      className="text-xs tracking-[0.18em] uppercase mb-1"
                      style={{ color: GOLD }}
                    >
                      Live updates
                    </div>
                    <h3
                      className="text-lg"
                      style={{
                        fontFamily: "Playfair Display, serif",
                        color: "#f0e3cf",
                      }}
                    >
                      Recent guest activity
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSection("analytics")}
                    className="text-xs"
                    style={{ color: GOLD }}
                  >
                    View analytics →
                  </button>
                </div>
                <div className="space-y-1">
                  {activityItems.length === 0 && (
<EmptyState title="No activity yet">Guest responses, opens and check-ins will appear here.</EmptyState>
)}
{activityItems.map((activity) => (
                    <div
                      key={activity.key}
                      className="flex items-center gap-3 py-3 admin-activity-row"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{ background: "#f1eadf", color: "#8a6739" }}
                      >
                        {activity.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-sm truncate"
                          style={{ color: "#f0e3cf" }}
                        >
                          {activity.title}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "#998873" }}
                        >
                          {activity.detail}
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: "#aa9b89" }}>
                        {relativeTime(activity.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 admin-panel p-6 rounded-2xl">
                <div
                  className="text-xs tracking-[0.18em] uppercase mb-1"
                  style={{ color: GOLD }}
                >
                  Planning
                </div>
                <h3
                  className="text-lg mb-5"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#f0e3cf",
                  }}
                >
                  Your next priorities
                </h3>
                <div className="space-y-3">
                  {checklist.map((task) => (
                    <div
                      key={task.label}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{ background: task.done ? "#f2f5f0" : "#faf7f2" }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{
                          border: `1px solid ${task.done ? SAGE : "#cdbb9f"}`,
                          color: SAGE,
                        }}
                      >
                        {task.done ? "✓" : ""}
                      </div>
                      <div>
                        <div
                          className="text-sm"
                          style={{
                            color: task.done ? "#879084" : "#3d3025",
                            textDecoration: task.done ? "line-through" : "none",
                          }}
                        >
                          {task.label}
                        </div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: task.done ? SAGE : "#a17b49" }}
                        >
                          {task.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveSection("editor")}
                  className="w-full mt-4 py-2.5 rounded-lg text-xs"
                  style={{ border: "1px solid #dfd3c1", color: "#d9c5a7" }}
                >
                  Open CMS Editor
                </button>
              </div>
            </div>
          </div>
        )

      case "guests":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-wrap">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guests..."
                  aria-label="Search guests"
                  className="px-4 py-2 text-sm outline-none"
                  style={{ ...inputStyle, background: "#fff", width: "220px" }}
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label="Filter by category"
                  className="browser-default px-4 py-2 text-sm outline-none"
                  style={{ ...inputStyle, background: "#fff" }}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => csvInput.current?.click()}
                  className="px-4 py-2 text-xs tracking-wide transition-all hover:opacity-80"
                  style={quietButton}
                >
                  Import CSV
                </button>
                <input
                  ref={csvInput}
                  type="file"
                  hidden
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ""
                    if (file) void handleCsv(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setModal({ guest: null })}
                  className="btn waves-effect px-4 py-2 text-xs tracking-wide transition-all hover:opacity-90"
                  style={goldButton}
                >
                  + Add Guest
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e0d8cc" }}
            >
              {guests.length === 0 ? (
                <EmptyState title="No guests yet">
                  Add your first guest, or import a CSV file with the columns name, phone, category.
                </EmptyState>
              ) : filteredGuests.length === 0 ? (
                <EmptyState title="No guests match your filters" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="highlight w-full text-sm">
                    <thead>
                      <tr style={{ background: "#faf8f5", borderBottom: "1px solid #e0d8cc" }}>
                        {["Guest Name", "Phone", "Category", "RSVP Status", "Check-in", "Actions"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs tracking-widest uppercase"
                            style={{ color: "#ad9a80", fontWeight: 500 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests.map((guest) => (
                        <tr
                          key={guest.id}
                          className="transition-colors hover:bg-amber-50/30"
                          style={{ borderBottom: "1px solid #f5f0ea" }}
                        >
                          <td className="px-4 py-3 font-medium" style={{ color: "#f0e3cf" }}>
                            {guest.name}
                          </td>
                          <td className="px-4 py-3" style={{ color: "#ad9a80" }}>
                            {guest.phone || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ background: "rgba(184,150,90,0.14)", color: "#d9c5a7" }}
                            >
                              {guest.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{
                                background:
                                  guest.status === "Confirmed"
                                    ? "rgba(122,158,126,0.15)"
                                    : guest.status === "Declined"
                                      ? "rgba(200,100,100,0.1)"
                                      : "rgba(184,150,90,0.1)",
                                color:
                                  guest.status === "Confirmed"
                                    ? SAGE
                                    : guest.status === "Declined"
                                      ? "#c05050"
                                      : GOLD,
                              }}
                            >
                              {guest.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs" style={{ color: guest.checkedIn ? SAGE : "#ad9a80" }}>
                              {guest.checkedIn ? "✓ Checked In" : "○ Not Yet"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void copyLink(guest)}
                                className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                                style={{ color: GOLD, border: `1px solid ${GOLD}` }}
                              >
                                Link
                              </button>
                              <button
                                type="button"
                                onClick={() => setModal({ guest })}
                                className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                                style={{ color: "#d9c5a7", border: "1px solid #e0d8cc" }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(guest)}
                                className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                                style={{ color: "#c05050", border: "1px solid rgba(192,80,80,0.5)" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case "rsvp":
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Confirmed", list: stats.confirmed, color: SAGE },
                { label: "Pending", list: stats.pending, color: GOLD },
                { label: "Declined", list: stats.declined, color: "#c05050" },
              ].map((group) => (
                <div
                  key={group.label}
                  className="p-5 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #e0d8cc" }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3
                      className="font-semibold"
                      style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
                    >
                      {group.label}
                    </h3>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: group.color, fontFamily: "Playfair Display, serif" }}
                    >
                      {group.list.length}
                    </span>
                  </div>
                  <div className="text-xs mb-4" style={{ color: "#ad9a80" }}>
                    {stats.headcount(group.list)} {stats.headcount(group.list) === 1 ? "person" : "people"}
                  </div>
                  <div className="space-y-2">
                    {group.list.length === 0 && (
                      <div className="text-xs py-2" style={{ color: "#ad9a80" }}>
                        No guests in this group yet.
                      </div>
                    )}
                    {group.list.slice(0, 5).map((g) => (
                      <div
                        key={g.id}
                        className="text-xs flex justify-between items-center gap-2 py-1"
                        style={{ borderBottom: "1px solid #f5f0ea", color: "#d9c5a7" }}
                      >
                        <span>{g.name}</span>
                        <span className="flex items-center gap-2" style={{ color: "#ad9a80" }}>
                          {g.category}
                          {group.label === "Pending" && whatsappUrl(g.phone, `Hello ${g.name}, a gentle reminder to RSVP to the wedding of ${names}: ${guestLink(g.code)}`) && (
                            <a
                              href={whatsappUrl(g.phone, `Hello ${g.name}, a gentle reminder to RSVP to the wedding of ${names}: ${guestLink(g.code)}`)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: GOLD }}
                            >
                              Remind
                            </a>
                          )}
                        </span>
                      </div>
                    ))}
                    {group.list.length > 5 && (
                      <button
                        type="button"
                        className="text-xs"
                        style={{ color: GOLD }}
                        onClick={() => {
                          setFilterCategory("All")
                          setActiveSection("guests")
                        }}
                      >
                        +{group.list.length - 5} more in Guest Management →
                      </button>
                    )}
                  </div>
                  {group.label === "Pending" && (
                    <button
                      type="button"
                      disabled={stats.pending.length === 0}
                      onClick={async () => {
                        const ok = await copyText(
                          `Dear guest, a gentle reminder to RSVP to the wedding of ${names} on ${dateLong}. Please use your personal invitation link.`,
                        )
                        show(ok ? "Reminder message copied. Paste it into WhatsApp or email." : "Could not copy the reminder message.", ok ? "success" : "error")
                      }}
                      className="btn waves-effect w-full mt-4 py-2 text-xs tracking-wide transition-all hover:opacity-90"
                      style={{ ...goldButton, borderRadius: "6px", opacity: stats.pending.length === 0 ? 0.5 : 1 }}
                    >
                      Copy Reminder Message
                    </button>
                  )}
                </div>
              ))}
            </div>
            {stats.total === 0 && (
              <div className="rounded-2xl" style={{ background: "#fff", border: "1px solid #e0d8cc" }}>
                <EmptyState title="No RSVP responses yet">Responses appear here once guests are added and reply.</EmptyState>
              </div>
            )}
          </div>
        )

      case "invitations":
        return (
          <div className="space-y-4">
            <form
              onSubmit={generateLink}
              className="p-6 rounded-2xl"
              style={{ background: "#fff", border: "1px solid #e0d8cc" }}
            >
              <h3
                className="text-lg mb-4"
                style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
              >
                Generate Personalized Link
              </h3>
              <div className="flex gap-3">
                <input
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="Enter guest name"
                  aria-label="Guest name"
                  className="flex-1 px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
                <button
                  type="submit"
                  className="btn waves-effect px-6 py-3 text-sm tracking-wide transition-all hover:opacity-90"
                  style={goldButton}
                >
                  Generate
                </button>
              </div>
            </form>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e0d8cc" }}
            >
              {guests.length === 0 ? (
                <EmptyState title="No invitation links yet">Generate a link above or add guests in Guest Management.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="highlight w-full text-sm">
                    <thead>
                      <tr style={{ background: "#faf8f5", borderBottom: "1px solid #e0d8cc" }}>
                        {["Guest Name", "Invitation Link", "QR Code", "Status", ""].map((h, i) => (
                          <th
                            key={i}
                            className="text-left px-4 py-3 text-xs tracking-widest uppercase"
                            style={{ color: "#ad9a80", fontWeight: 500 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map((guest) => (
                        <tr key={guest.id} style={{ borderBottom: "1px solid #f5f0ea" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: "#f0e3cf" }}>
                            {guest.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: GOLD }}>
                            {guestLink(guest.code)}
                          </td>
                          <td className="px-4 py-3">
                            <QrImage text={guestLink(guest.code)} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{
                                background: guest.openedAt ? "rgba(122,158,126,0.15)" : "rgba(184,150,90,0.1)",
                                color: guest.openedAt ? SAGE : GOLD,
                              }}
                            >
                              {guest.openedAt ? "Opened" : "Not opened"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => void copyLink(guest)}
                              className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                              style={{ color: GOLD, border: `1px solid ${GOLD}` }}
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case "checkin":
        return <CheckinPanel guests={guests} notify={show} />

      case "analytics": {
        const responded = stats.confirmed.length + stats.declined.length
        const mobile = visits.filter((v) => v.device === "mobile").length
        const funnel = [
          { label: "Invited", value: stats.total },
          { label: "Opened", value: stats.opened.length },
          { label: "Responded", value: responded },
          { label: "Confirmed", value: stats.confirmed.length },
          { label: "Checked In", value: stats.checkedIn.length },
        ]
        const summary = [
          {
            label: "Total Invitation Views",
            value: String(visits.length),
            sub: visits.length ? "Recorded visits" : "No visits recorded yet",
          },
          {
            label: "Response Rate",
            value: `${pct(responded, stats.total)}%`,
            sub: stats.total ? `${responded} of ${stats.total} guests replied` : "No guests yet",
          },
          {
            label: "Mobile vs Desktop",
            value: visits.length ? `${pct(mobile, visits.length)}% / ${100 - pct(mobile, visits.length)}%` : "0% / 0%",
            sub: visits.length ? (mobile * 2 >= visits.length ? "Mobile-dominant" : "Desktop-dominant") : "No visits recorded yet",
          },
        ]
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className="p-6 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #e0d8cc" }}
              >
                <h3
                  className="text-lg mb-4"
                  style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
                >
                  Invitation Views
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#ad9a80" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(max, 4)]} tick={{ fontSize: 11, fill: "#ad9a80" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="visits" stroke={GOLD} fill="url(#grad2)" name="Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                className="p-6 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #e0d8cc" }}
              >
                <h3
                  className="text-lg mb-4"
                  style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
                >
                  RSVP Conversion
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#ad9a80" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(max, 4)]} tick={{ fontSize: 11, fill: "#ad9a80" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} name="Guests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="p-5 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #e0d8cc" }}
                >
                  <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "#ad9a80" }}>
                    {item.label}
                  </div>
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs" style={{ color: GOLD }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "editor":
        return <CmsEditorWorkspace />

      case "theme":
        return (
          <div className="space-y-6">
            <div>
              <h3
                className="text-lg mb-4"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#f0e3cf",
                }}
              >
                Choose Theme
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((theme, i) => (
                  <div
                    key={theme.name}
                    onClick={() => setSelectedTheme(i)}
                    className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
                    style={{
                      background: "#fff",
                      border:
                        selectedTheme === i
                          ? `2px solid ${GOLD}`
                          : "2px solid #e0d8cc",
                    }}
                  >
                    <div className="flex gap-1 mb-3">
                      {theme.colors.map((c, j) => (
                        <div
                          key={j}
                          className="flex-1 h-8 rounded"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#f0e3cf" }}
                    >
                      {theme.name}
                    </div>
                    {selectedTheme === i && (
                      <div className="text-xs mt-1" style={{ color: GOLD }}>
                        ✓ Active
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div
                className="p-6 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #e0d8cc" }}
              >
                <h3
                  className="text-base mb-4"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#f0e3cf",
                  }}
                >
                  Typography
                </h3>
                <div className="space-y-3">
                  {["Playfair Display", "Cormorant", "EB Garamond"].map(
                    (font) => (
                      <label
                        key={font}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="font"
                          defaultChecked={font === "Playfair Display"}
                          className="browser-default"
                        />
                        <span
                          className="text-sm"
                          style={{
                            color: "#f0e3cf",
                            fontFamily: font + ", serif",
                          }}
                        >
                          {font}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div
                className="p-6 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #e0d8cc" }}
              >
                <h3
                  className="text-base mb-4"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: "#f0e3cf",
                  }}
                >
                  Layout
                </h3>
                <div className="space-y-3">
                  {["Scroll (Single Page)", "Multi-Page", "Magazine"].map(
                    (layout) => (
                      <label
                        key={layout}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="layout"
                          defaultChecked={layout === "Scroll (Single Page)"}
                          className="browser-default"
                        />
                        <span className="text-sm" style={{ color: "#f0e3cf" }}>
                          {layout}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div style={{ color: "#ad9a80" }}>
            Select a section from the sidebar.
          </div>
        )
    }
  }

  return (
    <div
      className="admin-shell min-h-screen flex"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className="admin-sidebar flex-shrink-0 flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen ? "240px" : "60px",
        }}
      >
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(184,150,90,0.15)" }}
        >
          {sidebarOpen && (
            <div>
              <div
                className="text-sm font-bold"
                style={{
                  fontFamily: "Playfair Display, serif",
                  color: "#f5ecd8",
                }}
              >
                {content.couple.groomNick.slice(0, 1)} & {content.couple.brideNick.slice(0, 1)}
              </div>
              <div
                className="text-xs"
                style={{ color: "rgba(184,150,90,0.6)" }}
              >
                Admin
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sm transition-all hover:opacity-80"
            style={{
              color: "rgba(184,150,90,0.6)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: sidebarOpen ? 0 : "auto",
              marginRight: sidebarOpen ? 0 : "auto",
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="admin-sidebar-nav flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-100"
              style={{
                background:
                  activeSection === item.id
                    ? "rgba(184,150,90,0.15)"
                    : "transparent",
                color:
                  activeSection === item.id ? GOLD : "rgba(245,236,216,0.6)",
                border:
                  activeSection === item.id
                    ? "1px solid rgba(184,150,90,0.2)"
                    : "1px solid transparent",
              }}
            >
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="text-xs tracking-wide truncate">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div
          className="p-3 space-y-1"
          style={{ borderTop: "1px solid rgba(184,150,90,0.15)" }}
        >
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{
              color: "rgba(245,236,216,0.5)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span className="text-sm">↗</span>
            {sidebarOpen && <span className="text-xs">View Invitation</span>}
          </button>
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{
              color: "rgba(245,236,216,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span className="text-sm">⎋</span>
            {sidebarOpen && <span className="text-xs">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className={`admin-topbar flex items-center justify-between px-6 py-4 ${
            activeSection === "editor" ? "editor-topbar" : ""
          }`}
        >
          <div>
            <div
              className="text-[10px] tracking-[0.22em] uppercase mb-1"
              style={{ color: "#a88858" }}
            >
              {names} / Workspace
            </div>
            <h1
              className="text-xl font-bold"
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#f0e3cf",
              }}
            >
              {navItems.find((n) => n.id === activeSection)?.label ||
                "Dashboard"}
            </h1>
            <p className="text-xs" style={{ color: "#ad9a80" }}>
              Wedding of {names} · {dateLong}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="hidden sm:block px-3 py-2 text-xs rounded-lg"
              style={{ border: "1px solid #dfd3c1", color: "#d9c5a7" }}
            >
              View live invitation
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`,
                color: "#fff",
              }}
            >
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          className={`flex-1 overflow-auto ${
            activeSection === "editor"
              ? "admin-editor-main"
              : "p-4 md:p-6 lg:p-8"
          }`}
        >
          {renderSection()}
          {toastNode}
          {modal && (
            <GuestModal
              guest={modal.guest}
              onClose={() => setModal(null)}
              onSaved={() => setModal(null)}
              notify={show}
            />
          )}
          {confirmDelete && (
            <div className="admin-modal-backdrop" onClick={() => setConfirmDelete(null)}>
              <div
                className="admin-modal space-y-4"
                role="alertdialog"
                aria-modal="true"
                aria-label="Delete guest"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg" style={{ fontFamily: "Playfair Display, serif", color: "#f0e3cf" }}>
                  Delete guest?
                </h3>
                <p className="text-sm">
                  {confirmDelete.name} will be removed from the guest list, RSVP and check-in data. This cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-xs" style={quietButton}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = deleteGuest(confirmDelete.id)
                      show(result.ok ? `${confirmDelete.name} was deleted.` : result.error, result.ok ? "success" : "error")
                      setConfirmDelete(null)
                    }}
                    className="px-4 py-2 text-xs"
                    style={{ background: "#8b2f2f", color: "#fff", borderRadius: "8px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
