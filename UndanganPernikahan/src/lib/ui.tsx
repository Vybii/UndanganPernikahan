import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

export function useToast(): {
  show: (message: string, kind?: "success" | "error") => void
  node: ReactNode
} {
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    const onSyncError = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      window.clearTimeout(timer.current)
      setToast({ message: detail || "Could not reach the server.", kind: "error" })
      timer.current = window.setTimeout(() => setToast(null), 6000)
    }
    window.addEventListener("wedding-sync-error", onSyncError)
    return () => window.removeEventListener("wedding-sync-error", onSyncError)
  }, [])
  const show = useCallback((message: string, kind: "success" | "error" = "success") => {
    window.clearTimeout(timer.current)
    setToast({ message, kind })
    timer.current = window.setTimeout(() => setToast(null), kind === "error" ? 6000 : 3000)
  }, [])
  const node = toast ? (
    <div className={`app-toast is-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
      {toast.message}
    </div>
  ) : null
  return { show, node }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand("copy")
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}
