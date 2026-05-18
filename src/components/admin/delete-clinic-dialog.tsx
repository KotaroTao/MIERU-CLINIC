"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X, AlertTriangle } from "lucide-react"
import { messages } from "@/lib/messages"

interface DeleteClinicDialogProps {
  clinicId: string
  clinicName: string
  onClose: () => void
}

export function DeleteClinicDialog({ clinicId, clinicName, onClose }: DeleteClinicDialogProps) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const m = messages.admin
  const canSubmit = confirmName.trim() === clinicName && !saving && !success

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? m.deleteClinicFailed)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 800)
    } catch {
      setError(m.deleteClinicFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">{m.deleteClinicTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {m.deleteClinicWarning}
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {m.deleteClinicConfirmLabel}
            </p>
            <p className="mb-2 rounded-md bg-muted px-3 py-1.5 text-sm font-mono">
              {clinicName}
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              placeholder={clinicName}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              {m.deleteClinicSuccess}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {messages.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {m.deleteClinicSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
