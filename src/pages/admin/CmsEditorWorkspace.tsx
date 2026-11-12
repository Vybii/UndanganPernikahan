import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react"
import { useNavigate } from "react-router"
import {
  resolveSrc,
  type GalleryLayout,
  type GalleryPhoto,
  type SiteContent,
} from "../../lib/content"
import {
  deleteAudioBlob,
  formatBytes,
  loadAudioBlob,
  processImage,
  saveAudioBlob,
  saveContent,
  useSavedContent,
  validateAudio,
} from "../../lib/store"
import { useToast } from "../../lib/ui"

type IconName = "couple" | "calendar" | "gallery" | "gift" | "music" | "desktop" | "tablet" | "mobile" | "expand" | "refresh" | "eye" | "upload" | "map" | "plus" | "trash" | "play" | "chevron"

function Icon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  const paths: Record<IconName, ReactNode> = {
    couple: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="8" r="3" />
        <path d="M3.5 20c.3-4.1 2.1-6.2 5.5-6.2 1.7 0 3 .5 4 1.5 1-1 2.3-1.5 4-1.5 3.4 0 5.2 2.1 5.5 6.2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    gallery: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M12 9v12M3 13h18M7.5 9C5 9 4 7.7 4 6.4 4 5 5.1 4 6.5 4 9 4 12 9 12 9s3-5 5.5-5C18.9 4 20 5 20 6.4 20 7.7 19 9 16.5 9" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    desktop: (
      <>
        <rect x="2.5" y="4" width="19" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    tablet: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    mobile: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    expand: (
      <>
        <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6.1 8a7 7 0 0 1 11.5-2.3L20 8M4 16l2.4 2.3A7 7 0 0 0 17.9 16" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 15v5h16v-5" />
      </>
    ),
    map: (
      <>
        <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

type TabId = "couple" | "details" | "gallery" | "gift" | "music"

const editorTabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: "couple", label: "Couple", icon: "couple" },
  { id: "details", label: "Details", icon: "calendar" },
  { id: "gallery", label: "Gallery", icon: "gallery" },
  { id: "gift", label: "Gift", icon: "gift" },
  { id: "music", label: "Music", icon: "music" },
]

const MAX_GALLERY_PHOTOS = 12

type SetSection = <K extends keyof SiteContent>(
  section: K,
  patch: Partial<SiteContent[K]>,
) => void

interface FormProps {
  c: SiteContent
  set: SetSection
  notify: (message: string, kind?: "success" | "error") => void
}

function Field({
  label,
  children,
  hint,
  group = false,
}: {
  label: string
  children: ReactNode
  hint?: string
  group?: boolean
}) {
  const Tag = group ? "div" : "label"
  return (
    <Tag className="cms-field">
      <span className="cms-field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </Tag>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  list,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  list?: string
}) {
  return (
    <input
      className="cms-input"
      type={type}
      value={value}
      list={list}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function TextArea({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <textarea
      className="cms-input cms-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function UploadCard({
  label,
  image,
  circular = false,
  note = "PNG, JPG or WebP, up to 5 MB",
  onFile,
  onRemove,
}: {
  label: string
  image?: string
  circular?: boolean
  note?: string
  onFile: (file: File) => void | Promise<void>
  onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="cms-upload-card">
      {image ? (
        <img className={circular ? "is-circular" : ""} src={image} alt="" />
      ) : (
        <div className="cms-upload-placeholder">
          <Icon name="upload" />
        </div>
      )}
      <div className="cms-upload-copy">
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <button
        type="button"
        className="cms-text-button"
        onClick={() => inputRef.current?.click()}
      >
        <Icon name="upload" /> {image ? "Replace" : "Choose file"}
      </button>
      {onRemove && image && (
        <button type="button" className="cms-text-button" onClick={onRemove}>
          <Icon name="trash" /> Remove
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) void onFile(file)
        }}
      />
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string
  title: string
  copy: string
}) {
  return (
    <div className="cms-form-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  )
}

function useImageUpload(
  notify: FormProps["notify"],
  opts: { maxDim: number; quality?: number; keepPng?: boolean },
  apply: (dataUrl: string) => void,
) {
  return async (file: File) => {
    try {
      apply(await processImage(file, opts))
    } catch (err) {
      notify(err instanceof Error ? err.message : "The image could not be loaded.", "error")
    }
  }
}

function CoupleForm({ c, set, notify }: FormProps) {
  const couple = c.couple
  const upBride = useImageUpload(notify, { maxDim: 1100, quality: 0.84 }, (src) =>
    set("couple", { bridePhoto: src }),
  )
  const upGroom = useImageUpload(notify, { maxDim: 1100, quality: 0.84 }, (src) =>
    set("couple", { groomPhoto: src }),
  )
  return (
    <>
      <SectionHeading
        eyebrow="The happy couple"
        title="Couple Information"
        copy="Introduce yourselves to your guests with names, portraits, and a personal note."
      />
      <div className="cms-form-section">
        <h3>Names &amp; portraits</h3>
        <div className="cms-form-grid">
          <Field label="Bride Name">
            <TextInput value={couple.brideName} onChange={(v) => set("couple", { brideName: v })} />
          </Field>
          <Field label="Groom Name">
            <TextInput value={couple.groomName} onChange={(v) => set("couple", { groomName: v })} />
          </Field>
          <Field label="Bride Nickname" hint="Shown in headings, e.g. “Angga & Ayu”.">
            <TextInput value={couple.brideNick} onChange={(v) => set("couple", { brideNick: v })} />
          </Field>
          <Field label="Groom Nickname">
            <TextInput value={couple.groomNick} onChange={(v) => set("couple", { groomNick: v })} />
          </Field>
        </div>
        <div className="cms-form-grid">
          <Field label="Bride Profile Photo" group>
            <UploadCard
              label="Bride portrait"
              image={resolveSrc(couple.bridePhoto)}
              circular
              onFile={upBride}
            />
          </Field>
          <Field label="Groom Profile Photo" group>
            <UploadCard
              label="Groom portrait"
              image={resolveSrc(couple.groomPhoto)}
              circular
              onFile={upGroom}
            />
          </Field>
        </div>
      </div>
      <div className="cms-form-section">
        <h3>Personal introductions</h3>
        <div className="cms-form-grid">
          <Field label="Bride Quote / Description">
            <TextArea value={couple.brideDesc} onChange={(v) => set("couple", { brideDesc: v })} />
          </Field>
          <Field label="Groom Quote / Description">
            <TextArea value={couple.groomDesc} onChange={(v) => set("couple", { groomDesc: v })} />
          </Field>
        </div>
      </div>
      <div className="cms-form-section">
        <h3>Family &amp; social</h3>
        <div className="cms-form-grid">
          <Field label="Bride Instagram">
            <TextInput
              value={couple.brideInstagram}
              placeholder="@username"
              onChange={(v) => set("couple", { brideInstagram: v })}
            />
          </Field>
          <Field label="Groom Instagram">
            <TextInput
              value={couple.groomInstagram}
              placeholder="@username"
              onChange={(v) => set("couple", { groomInstagram: v })}
            />
          </Field>
          <Field label="Bride's Parents">
            <TextInput
              value={couple.brideParents}
              onChange={(v) => set("couple", { brideParents: v })}
            />
          </Field>
          <Field label="Groom's Parents">
            <TextInput
              value={couple.groomParents}
              onChange={(v) => set("couple", { groomParents: v })}
            />
          </Field>
        </div>
      </div>
    </>
  )
}

function DetailsForm({ c, set }: FormProps) {
  const d = c.details
  return (
    <>
      <SectionHeading
        eyebrow="The celebration"
        title="Wedding Details"
        copy="Set the date, schedule, and destination for your wedding celebration."
      />
      <div className="cms-form-section">
        <h3>Date &amp; time</h3>
        <div className="cms-form-grid">
          <Field label="Wedding Date">
            <TextInput type="date" value={d.date} onChange={(v) => set("details", { date: v })} />
          </Field>
          <Field label="Timezone">
            <select
              className="cms-input"
              value={d.timezone}
              onChange={(e) =>
                set("details", { timezone: e.target.value as SiteContent["details"]["timezone"] })
              }
            >
              <option>WIB</option>
              <option>WITA</option>
              <option>WIT</option>
            </select>
          </Field>
          <Field label="Ceremony Start">
            <TextInput
              type="time"
              value={d.ceremonyStart}
              onChange={(v) => set("details", { ceremonyStart: v })}
            />
          </Field>
          <Field label="Ceremony End">
            <TextInput
              type="time"
              value={d.ceremonyEnd}
              onChange={(v) => set("details", { ceremonyEnd: v })}
            />
          </Field>
          <Field label="Reception Start">
            <TextInput
              type="time"
              value={d.receptionStart}
              onChange={(v) => set("details", { receptionStart: v })}
            />
          </Field>
          <Field label="Reception End">
            <TextInput
              type="time"
              value={d.receptionEnd}
              onChange={(v) => set("details", { receptionEnd: v })}
            />
          </Field>
        </div>
      </div>
      <div className="cms-form-section">
        <h3>Venue</h3>
        <Field label="Venue Name">
          <TextInput value={d.venueName} onChange={(v) => set("details", { venueName: v })} />
        </Field>
        <Field label="City / Region" hint="Shown on the event cards, e.g. “Pekanbaru, Riau”.">
          <TextInput value={d.city} onChange={(v) => set("details", { city: v })} />
        </Field>
        <Field label="Full Address">
          <TextArea value={d.address} onChange={(v) => set("details", { address: v })} />
        </Field>
        <Field
          label="Google Maps Link"
          hint="Optional. Paste the public location link; otherwise a search for the venue is used."
        >
          <div className="cms-input-with-icon">
            <Icon name="map" />
            <input
              value={d.mapsLink}
              placeholder="https://maps.app.goo.gl/…"
              onChange={(e) => set("details", { mapsLink: e.target.value })}
            />
          </div>
        </Field>
      </div>
      <div className="cms-map-card">
        <div className="cms-map-pin">
          <Icon name="map" />
        </div>
        <div>
          <strong>{d.venueName || "Venue"}</strong>
          <span>{d.city}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const link = d.mapsLink.trim()
            const url = /^https?:\/\//i.test(link)
              ? link
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [d.venueName, d.city].filter(Boolean).join(", "),
                )}`
            window.open(url, "_blank", "noopener,noreferrer")
          }}
        >
          Open map <Icon name="chevron" />
        </button>
      </div>
    </>
  )
}

const LAYOUTS: { id: GalleryLayout; label: string }[] = [
  { id: "editorial", label: "Editorial" },
  { id: "masonry", label: "Masonry" },
  { id: "grid", label: "Classic grid" },
]

function GalleryForm({ c, set, notify }: FormProps) {
  const { layout, photos } = c.gallery
  const addInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const replaceId = useRef<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = async (files: File[]) => {
    if (!files.length) return
    const room = MAX_GALLERY_PHOTOS - photos.length
    if (room <= 0) {
      notify(`The gallery is limited to ${MAX_GALLERY_PHOTOS} photos. Remove one first.`, "error")
      return
    }
    const accepted = files.slice(0, room)
    const added: GalleryPhoto[] = []
    const failures: string[] = []
    for (const file of accepted) {
      try {
        const src = await processImage(file, { maxDim: 1100, quality: 0.78 })
        added.push({
          id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          src,
          label: "Gallery photo",
          real: true,
        })
      } catch (err) {
        failures.push(err instanceof Error ? err.message : `"${file.name}" failed.`)
      }
    }
    if (added.length) set("gallery", { photos: [...photos, ...added] })
    if (files.length > room) failures.push(`Only ${room} more photo(s) fit; the rest were skipped.`)
    if (failures.length) notify(failures[0], "error")
  }

  const replacePhoto = async (file: File) => {
    const id = replaceId.current
    if (!id) return
    try {
      const src = await processImage(file, { maxDim: 1100, quality: 0.78 })
      set("gallery", {
        photos: photos.map((p) => (p.id === id ? { ...p, src, real: true } : p)),
      })
    } catch (err) {
      notify(err instanceof Error ? err.message : "The image could not be loaded.", "error")
    }
  }

  const makeCover = (id: string) => {
    const target = photos.find((p) => p.id === id)
    if (target) set("gallery", { photos: [target, ...photos.filter((p) => p.id !== id)] })
  }

  return (
    <>
      <SectionHeading
        eyebrow="Captured moments"
        title="Wedding Gallery"
        copy="Curate a visual story with your favorite photographs and an elegant layout."
      />
      <div className="cms-form-section">
        <h3>Gallery layout</h3>
        <div className="cms-layout-options">
          {LAYOUTS.map((item, index) => (
            <label className={layout === item.id ? "is-selected" : ""} key={item.id}>
              <input
                type="radio"
                name="gallery-layout"
                checked={layout === item.id}
                onChange={() => set("gallery", { layout: item.id })}
              />
              <span className={`cms-layout-sketch sketch-${index + 1}`}>
                <i />
                <i />
                <i />
              </span>
              <strong>{item.label}</strong>
            </label>
          ))}
        </div>
        {layout === "editorial" && photos.length < 9 && (
          <small className="cms-layout-note">
            The editorial collage is designed for 9 or more photos. With fewer, the
            gallery flows as a featured-photo layout.
          </small>
        )}
      </div>
      <div className="cms-form-section">
        <div className="cms-section-title-row">
          <h3>Gallery photos</h3>
          <span>
            {photos.length} / {MAX_GALLERY_PHOTOS} photos
          </span>
        </div>
        <button
          className="cms-dropzone"
          type="button"
          style={dragging ? { borderColor: "#b99a72" } : undefined}
          onClick={() => addInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void addFiles(Array.from(e.dataTransfer.files))
          }}
        >
          <Icon name="upload" />
          <strong>Upload photographs</strong>
          <span>Drop files here or browse your device · PNG, JPG or WebP, up to 5 MB each</span>
        </button>
        <input
          ref={addInput}
          type="file"
          multiple
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ""
            void addFiles(files)
          }}
        />
        <input
          ref={replaceInput}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) void replacePhoto(file)
          }}
        />
        {photos.length === 0 ? (
          <p className="cms-empty-note">No photos yet. Upload some to show a gallery on the invitation.</p>
        ) : (
          <div className="cms-gallery-grid">
            {photos.map((photo, index) => (
              <div key={photo.id} className={index === 0 ? "is-featured" : ""}>
                <img src={resolveSrc(photo.src)} alt="" />
                {index === 0 && <span>Cover</span>}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() =>
                    set("gallery", { photos: photos.filter((p) => p.id !== photo.id) })
                  }
                >
                  <Icon name="trash" />
                </button>
                <button
                  type="button"
                  aria-label="Replace photo"
                  style={{ right: "2.1rem" }}
                  onClick={() => {
                    replaceId.current = photo.id
                    replaceInput.current?.click()
                  }}
                >
                  <Icon name="upload" />
                </button>
                {index !== 0 && (
                  <button
                    type="button"
                    aria-label="Set as cover"
                    style={{ right: "3.85rem" }}
                    onClick={() => makeCover(photo.id)}
                  >
                    <Icon name="eye" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function GiftForm({ c, set, notify }: FormProps) {
  const g = c.gift
  const upQris = useImageUpload(notify, { maxDim: 900, quality: 0.9, keepPng: true }, (src) =>
    set("gift", { qris: src }),
  )
  return (
    <>
      <SectionHeading
        eyebrow="A token of love"
        title="Wedding Gift"
        copy="Offer secure and thoughtful ways for guests to send their blessings."
      />
      <div className="cms-form-section">
        <h3>Section text</h3>
        <Field label="Heading">
          <TextInput value={g.heading} onChange={(v) => set("gift", { heading: v })} />
        </Field>
        <Field label="Message">
          <TextArea value={g.message} onChange={(v) => set("gift", { message: v })} />
        </Field>
      </div>
      <div className="cms-form-section">
        <div className="cms-section-title-row">
          <h3>Bank transfer</h3>
          <span className="cms-status-pill">{g.accountNumber.trim() ? "Active" : "Hidden"}</span>
        </div>
        <div className="cms-form-grid">
          <Field label="Bank Name">
            <TextInput
              value={g.bankName}
              list="cms-bank-list"
              onChange={(v) => set("gift", { bankName: v })}
            />
            <datalist id="cms-bank-list">
              {["BCA", "Mandiri", "BNI", "BRI", "CIMB Niaga", "Permata", "BSI"].map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Account Number" hint="Leave empty to hide this card.">
            <TextInput
              value={g.accountNumber}
              onChange={(v) => set("gift", { accountNumber: v })}
            />
          </Field>
        </div>
        <Field label="Account Holder">
          <TextInput
            value={g.accountHolder}
            onChange={(v) => set("gift", { accountHolder: v })}
          />
        </Field>
      </div>
      <div className="cms-form-section">
        <div className="cms-section-title-row">
          <h3>Digital wallet</h3>
          <span className="cms-status-pill">{g.walletNumber.trim() ? "Active" : "Hidden"}</span>
        </div>
        <div className="cms-form-grid">
          <Field label="Provider">
            <TextInput
              value={g.walletProvider}
              list="cms-wallet-list"
              onChange={(v) => set("gift", { walletProvider: v })}
            />
            <datalist id="cms-wallet-list">
              {["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"].map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Mobile Number" hint="Leave empty to hide this card.">
            <TextInput
              value={g.walletNumber}
              onChange={(v) => set("gift", { walletNumber: v })}
            />
          </Field>
        </div>
        <Field label="Account Holder">
          <TextInput
            value={g.walletHolder}
            onChange={(v) => set("gift", { walletHolder: v })}
          />
        </Field>
      </div>
      <div className="cms-form-section">
        <h3>QRIS payment</h3>
        <UploadCard
          label="QRIS code"
          image={resolveSrc(g.qris)}
          onFile={upQris}
          onRemove={() => set("gift", { qris: "" })}
        />
      </div>
    </>
  )
}

interface AudioState {
  file: File | null
  removed: boolean
}

function MusicForm({
  c,
  set,
  notify,
  audio,
  setAudio,
}: FormProps & { audio: AudioState; setAudio: (next: AudioState) => void }) {
  const m = c.music
  const fileInput = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    let alive = true
    if (m.hasAudio && !audio.file) {
      void loadAudioBlob().then((b) => alive && setSavedBlob(b))
    }
    return () => {
      alive = false
    }
  }, [m.hasAudio, audio.file])

  const playable: Blob | null = audio.file ?? (audio.removed || !m.hasAudio ? null : savedBlob)
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!playable) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(playable)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [playable])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, m.volume / 100))
      audioRef.current.loop = m.loop
    }
  }, [m.volume, m.loop, url])

  const upArtwork = useImageUpload(notify, { maxDim: 600, quality: 0.85 }, (src) =>
    set("music", { artwork: src }),
  )

  const clock = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`

  const onAudioFile = (file: File) => {
    try {
      validateAudio(file)
    } catch (err) {
      notify(err instanceof Error ? err.message : "That audio file is not supported.", "error")
      return
    }
    setPlaying(false)
    setAudio({ file, removed: false })
    set("music", { hasAudio: true, audioName: file.name })
  }

  const fileLabel = audio.file
    ? `${audio.file.name} · ${formatBytes(audio.file.size)} (not saved yet)`
    : m.hasAudio
      ? m.audioName || "Uploaded audio"
      : "No audio uploaded yet"

  return (
    <>
      <SectionHeading
        eyebrow="Your soundtrack"
        title="Invitation Music"
        copy="Set the mood with a meaningful song that accompanies the invitation."
      />
      <button
        className="cms-music-upload"
        type="button"
        onClick={() => fileInput.current?.click()}
      >
        <span>
          <Icon name="music" />
        </span>
        <strong>Upload your song</strong>
        <small>MP3 or WAV, maximum 15 MB</small>
        <em>
          <Icon name="upload" /> Browse file
        </em>
      </button>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onAudioFile(file)
        }}
      />
      <div className="cms-audio-file">
        <span>{fileLabel}</span>
        {(audio.file || m.hasAudio) && (
          <button
            type="button"
            className="cms-text-button"
            onClick={() => {
              setPlaying(false)
              setAudio({ file: null, removed: true })
              set("music", { hasAudio: false, audioName: "" })
            }}
          >
            <Icon name="trash" /> Remove audio
          </button>
        )}
      </div>
      <div className="cms-form-section">
        <h3>Song information</h3>
        <div className="cms-form-grid">
          <Field label="Song Title">
            <TextInput value={m.title} onChange={(v) => set("music", { title: v })} />
          </Field>
          <Field label="Artist">
            <TextInput value={m.artist} onChange={(v) => set("music", { artist: v })} />
          </Field>
        </div>
        <Field label="Cover Artwork" group>
          <UploadCard label="Album artwork" image={resolveSrc(m.artwork)} onFile={upArtwork} />
        </Field>
      </div>
      <div className="cms-player-card">
        <button
          type="button"
          disabled={!url}
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
            const el = audioRef.current
            if (!el) return
            if (el.paused) void el.play().catch(() => notify("This audio file could not be played.", "error"))
            else el.pause()
          }}
        >
          <Icon name="play" />
        </button>
        <div>
          <strong>{m.title || "Untitled"}</strong>
          <span>{m.artist || "Unknown artist"}</span>
        </div>
        <div className="cms-player-track">
          <i
            style={{
              width: progress.total ? `${(progress.current / progress.total) * 100}%` : "0%",
            }}
          />
        </div>
        <small>
          {clock(progress.current)} / {clock(progress.total)}
        </small>
        {url && (
          <audio
            ref={audioRef}
            src={url}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onLoadedMetadata={(e) =>
              setProgress({ current: 0, total: e.currentTarget.duration || 0 })
            }
            onTimeUpdate={(e) =>
              setProgress({
                current: e.currentTarget.currentTime,
                total: e.currentTarget.duration || 0,
              })
            }
          />
        )}
      </div>
      <div className="cms-form-section">
        <h3>Playback settings</h3>
        <label className="cms-toggle-row">
          <span>
            <strong>Autoplay music</strong>
            <small>Start after the guest opens the invitation</small>
          </span>
          <input
            type="checkbox"
            checked={m.autoplay}
            onChange={(e) => set("music", { autoplay: e.target.checked })}
          />
          <i />
        </label>
        <label className="cms-toggle-row">
          <span>
            <strong>Loop song</strong>
            <small>Repeat the track while guests are browsing</small>
          </span>
          <input
            type="checkbox"
            checked={m.loop}
            onChange={(e) => set("music", { loop: e.target.checked })}
          />
          <i />
        </label>
        <Field label={`Starting Volume (${m.volume}%)`}>
          <input
            className="cms-range"
            type="range"
            min={0}
            max={100}
            value={m.volume}
            onChange={(e) => set("music", { volume: Number(e.target.value) })}
          />
        </Field>
      </div>
    </>
  )
}

function InvitationPreview({
  device,
  frameRef,
  onLoad,
}: {
  device: string
  frameRef: React.RefObject<HTMLIFrameElement | null>
  onLoad: () => void
}) {
  // Renders the real guest-facing site in preview mode. The editor pushes its
  // current draft into the frame, so the preview never shows stale data.
  return (
    <div className={`cms-preview-device is-${device}`} id="cms-preview-device">
      <iframe
        ref={frameRef}
        className="cms-preview-frame"
        src={`${import.meta.env.BASE_URL}?preview=1`}
        title="Live invitation preview"
        onLoad={onLoad}
      />
    </div>
  )
}

function validateContent(c: SiteContent): { tab: TabId; message: string } | null {
  if (!c.couple.brideName.trim() || !c.couple.groomName.trim())
    return { tab: "couple", message: "Bride and groom names cannot be empty." }
  if (!c.couple.brideNick.trim() || !c.couple.groomNick.trim())
    return { tab: "couple", message: "Please enter a nickname for both the bride and the groom." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.details.date) || Number.isNaN(Date.parse(c.details.date)))
    return { tab: "details", message: "Please choose a valid wedding date." }
  if (!c.details.venueName.trim())
    return { tab: "details", message: "Venue name cannot be empty." }
  const link = c.details.mapsLink.trim()
  if (link && !/^https?:\/\//i.test(link))
    return { tab: "details", message: "The Google Maps link must start with http:// or https://." }
  return null
}

export default function CmsEditorWorkspace() {
  const navigate = useNavigate()
  const saved = useSavedContent()
  const { show, node: toastNode } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>("couple")
  const [device, setDevice] = useState("desktop")
  const [draft, setDraft] = useState<SiteContent>(saved)
  const [audio, setAudio] = useState<AudioState>({ file: null, removed: false })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(true)
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit")
  const frameRef = useRef<HTMLIFrameElement>(null)
  const latest = useRef({ draft, audio })
  latest.current = { draft, audio }

  // Follow saved changes made elsewhere (another tab) while nothing is being edited.
  useEffect(() => {
    if (!dirty) setDraft(saved)
  }, [saved, dirty])

  const set: SetSection = useCallback((section, patch) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], ...patch } }))
    setDirty(true)
  }, [])

  const updateAudio = useCallback((next: AudioState) => {
    setAudio(next)
    setDirty(true)
  }, [])

  const post = useCallback((message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [])

  const pushDraft = useCallback(() => {
    const { draft: d, audio: a } = latest.current
    post({ type: "cms-draft", content: d, audioBlob: a.file, audioRemoved: a.removed })
  }, [post])

  useEffect(() => {
    const id = window.setTimeout(pushDraft, 120)
    return () => window.clearTimeout(id)
  }, [draft, audio, pushDraft])

  useEffect(() => {
    post({ type: "cms-scroll", section: activeTab })
  }, [activeTab, post])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "cms-preview-ready") {
        pushDraft()
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [pushDraft])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const save = async () => {
    if (saving) return
    const problem = validateContent(draft)
    if (problem) {
      setActiveTab(problem.tab)
      show(problem.message, "error")
      return
    }
    setSaving(true)
    try {
      const next: SiteContent = { ...draft, music: { ...draft.music } }
      if (audio.file) {
        try {
          await saveAudioBlob(audio.file)
        } catch (err) {
          show(
            `The audio file could not be saved${err instanceof Error ? `: ${err.message}` : "."} Nothing was changed.`,
            "error",
          )
          return
        }
        next.music.hasAudio = true
        next.music.audioName = audio.file.name
      } else if (audio.removed) {
        try {
          await deleteAudioBlob()
        } catch {
          /* nothing stored, nothing to remove */
        }
        next.music.hasAudio = false
        next.music.audioName = ""
      }
      const result = saveContent(next)
      if (!result.ok) {
        show(`Changes were not saved. ${result.error}`, "error")
        return
      }
      setDraft(next)
      setAudio({ file: null, removed: false })
      setDirty(false)
      show("Changes saved. The invitation has been updated.")
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setDraft(saved)
    setAudio({ file: null, removed: false })
    setDirty(false)
    show("Unsaved changes were discarded.")
  }

  const formProps: FormProps = { c: draft, set, notify: show }
  const forms: Record<TabId, ReactNode> = {
    couple: <CoupleForm {...formProps} />,
    details: <DetailsForm {...formProps} />,
    gallery: <GalleryForm {...formProps} />,
    gift: <GiftForm {...formProps} />,
    music: <MusicForm {...formProps} audio={audio} setAudio={updateAudio} />,
  }

  return (
    <section className="cms-workspace">
      {toastNode}
      <header className="cms-editor-header">
        <div>
          <div className="cms-editor-kicker">Wedding content studio</div>
          <h1>CMS Editor</h1>
          <p>Manage your wedding invitation content.</p>
        </div>
        <div className="cms-header-actions">
          <div className={`cms-save-state ${dirty ? "is-dirty" : ""}`}>
            <i />
            {saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
          </div>
          <button
            type="button"
            className="cms-button cms-button-ghost"
            onClick={discard}
            disabled={!dirty || saving}
          >
            Discard
          </button>
          <button
            type="button"
            className="cms-button cms-button-primary"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="cms-button cms-button-live"
            onClick={() => navigate("/")}
          >
            <Icon name="eye" /> View Live Invitation
          </button>
        </div>
      </header>

      <nav className="cms-section-tabs" aria-label="Invitation sections">
        {editorTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="cms-mobile-switcher">
        <button
          type="button"
          className={mobileMode === "edit" ? "is-active" : ""}
          onClick={() => setMobileMode("edit")}
        >
          Edit content
        </button>
        <button
          type="button"
          className={mobileMode === "preview" ? "is-active" : ""}
          onClick={() => setMobileMode("preview")}
        >
          Live preview
        </button>
      </div>

      <div
        className={`cms-editor-split ${
          previewVisible ? "" : "is-preview-hidden"
        } is-mobile-${mobileMode}`}
      >
        <div className="cms-form-panel">
          <div className="cms-form-scroll" key={activeTab}>
            {forms[activeTab]}
            <div className="cms-form-footer">
              <span>
                <i />
                Changes are previewed automatically
              </span>
              <button
                type="button"
                className="cms-button cms-button-primary"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <aside className="cms-preview-panel">
          <div className="cms-preview-toolbar">
            <div>
              <strong>Live Preview</strong>
              <span>Invitation homepage</span>
            </div>
            <div className="cms-device-switcher">
              {(["desktop", "tablet", "mobile"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={device === item ? "is-active" : ""}
                  onClick={() => setDevice(item)}
                  aria-label={`${item} preview`}
                >
                  <Icon name={item} />
                </button>
              ))}
              <i />
              <button
                type="button"
                aria-label="Fullscreen preview"
                onClick={() => {
                  const el = document.getElementById("cms-preview-device")
                  if (el?.requestFullscreen) void el.requestFullscreen()
                  else navigate("/")
                }}
              >
                <Icon name="expand" />
              </button>
              <button
                type="button"
                aria-label="Refresh preview"
                onClick={() => {
                  frameRef.current?.contentWindow?.location.reload()
                }}
              >
                <Icon name="refresh" />
              </button>
            </div>
          </div>
          <div className="cms-preview-stage">
            <InvitationPreview
              device={device}
              frameRef={frameRef}
              onLoad={() => {
                pushDraft()
                post({ type: "cms-scroll", section: activeTab })
              }}
            />
          </div>
        </aside>

        <button
          type="button"
          className="cms-preview-collapse"
          onClick={() => setPreviewVisible(!previewVisible)}
          aria-label={previewVisible ? "Collapse preview" : "Expand preview"}
        >
          <Icon name="chevron" />{" "}
          <span>{previewVisible ? "Hide preview" : "Show preview"}</span>
        </button>
      </div>
    </section>
  )
}
