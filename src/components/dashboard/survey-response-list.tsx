"use client"

import { useState } from "react"
import { Star, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { PATIENT_ATTRIBUTE_LABEL_MAP } from "@/lib/constants"
import type { SurveyResponseItem } from "@/types"

interface SurveyResponseListProps {
  responses: SurveyResponseItem[]
  onDelete: (id: string) => void
}

export function SurveyResponseList({ responses, onDelete }: SurveyResponseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete(id)
      }
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="space-y-3">
      {responses.map((r) => (
        <div
          key={r.id}
          className="group flex items-start justify-between rounded-md border p-3 text-sm"
        >
          <div className="space-y-1 min-w-0 flex-1">
            {(() => {
              const pa = r.patientAttributes as Record<string, string> | null | undefined
              return pa ? (
                <div className="flex flex-wrap gap-1">
                  {["visitType", "insuranceType", "purpose", "treatmentType", "ageGroup", "gender"].map((key) => {
                    const val = pa[key]
                    if (!val) return null
                    return (
                      <span key={key} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        {PATIENT_ATTRIBUTE_LABEL_MAP[val] ?? val}
                      </span>
                    )
                  })}
                </div>
              ) : null
            })()}
            {r.freeText && (
              <p className="text-muted-foreground">{r.freeText}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {messages.dashboard.templateLabel}: {r.template.name}
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <div className="flex flex-col items-end gap-1">
              {r.overallScore !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {r.overallScore.toFixed(1)}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(r.respondedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}{" "}
                {new Date(r.respondedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
              </span>
            </div>
            {confirmId === r.id ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                >
                  {deletingId === r.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    messages.common.delete
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setConfirmId(null)}
                >
                  {messages.common.cancel}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmId(r.id)}
                title={messages.common.delete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
