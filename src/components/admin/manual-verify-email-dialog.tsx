"use client"

import { useState } from "react"
import { Loader2, X, ShieldCheck } from "lucide-react"
import { messages } from "@/lib/messages"

interface ManualVerifyEmailDialogProps {
  clinicId: string
  clinicName: string
  ownerEmail: string | null
  onClose: () => void
  onVerified: () => void
}

export function ManualVerifyEmailDialog({
  clinicId,
  clinicName,
  ownerEmail,
  onClose,
  onVerified,
}: ManualVerifyEmailDialogProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const m = messages.admin

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving || success) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/verify-email`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? m.manualVerifyEmailFailed)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        onClose()
        onVerified()
      }, 800)
    } catch {
      setError(m.manualVerifyEmailFailed)
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
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">{m.manualVerifyEmailTitle}</h2>
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
          <p className="text-sm text-muted-foreground">{m.manualVerifyEmailDesc}</p>

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">クリニック: </span>
              <span className="font-medium">{clinicName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">メール: </span>
              <span className="font-medium font-mono">{ownerEmail ?? "—"}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              {m.manualVerifyEmailSuccess}
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
              disabled={saving || success}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {m.manualVerifyEmailSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
