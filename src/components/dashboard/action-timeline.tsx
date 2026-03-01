"use client"

import { useState } from "react"
import { messages } from "@/lib/messages"
import { Clock, Pencil, MessageSquarePlus } from "lucide-react"
import type { ActionLog } from "./action-shared"
import { LOG_ACTION_CONFIG } from "./action-shared"

// ─── ActionTimeline ───

export function ActionTimeline({ logs, onLogUpdated }: { logs: ActionLog[]; onLogUpdated: (updatedLog: ActionLog) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editScore, setEditScore] = useState("")
  const [editNote, setEditNote] = useState("")
  const [saving, setSaving] = useState(false)

  function startEdit(log: ActionLog) {
    setEditingId(log.id)
    const d = new Date(log.createdAt)
    setEditDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    setEditScore(log.satisfactionScore != null ? String(log.satisfactionScore) : "")
    setEditNote(log.note ?? "")
  }

  async function handleSave(logId: string) {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (editDate) body.createdAt = new Date(editDate).toISOString()
      body.satisfactionScore = editScore ? Number(editScore) : null
      body.note = editNote || ""
      const res = await fetch(`/api/improvement-action-logs/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        onLogUpdated(updated)
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Clock className="h-3 w-3" />
        {messages.improvementActions.history}
      </p>
      <div className="relative ml-1.5 border-l-2 border-muted pl-4 space-y-2">
        {logs.map((log) => {
          const config = LOG_ACTION_CONFIG[log.action] ?? LOG_ACTION_CONFIG.started
          const Icon = config.icon
          const isEditing = editingId === log.id

          if (isEditing) {
            return (
              <div key={log.id} className="relative">
                <div className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${config.dotColor}`} />
                <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-muted-foreground">日付</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">{messages.improvementActions.satisfactionAt}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max="5"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        placeholder="例: 3.82"
                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">メモ</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="任意のメモ"
                      className="w-full rounded border bg-background px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleSave(log.id)}
                      disabled={saving}
                      className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? messages.common.loading : messages.common.save}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                    >
                      {messages.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={log.id} className="group relative">
              <div className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${config.dotColor}`} />
              <div className="flex items-center gap-2">
                <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleDateString("ja-JP")}
                </span>
                <button
                  onClick={() => startEdit(log)}
                  className="ml-auto hidden text-muted-foreground/50 hover:text-muted-foreground group-hover:inline-flex"
                  title="編集"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              {log.satisfactionScore != null && (
                <p className="mt-0.5 text-[11px] text-muted-foreground ml-5">
                  {messages.improvementActions.satisfactionAt}: <span className="font-semibold">{log.satisfactionScore}</span>
                </p>
              )}
              {log.note && (
                <p className="mt-0.5 text-[11px] text-muted-foreground ml-5">
                  {log.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AddLogForm ───

export function AddLogForm({
  actionId,
  onLogAdded,
}: {
  actionId: string
  onLogAdded: (actionId: string, newLog: ActionLog) => void
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!note.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/improvement-actions/${actionId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      })
      if (res.ok) {
        const newLog = await res.json()
        onLogAdded(actionId, newLog)
        setNote("")
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageSquarePlus className="h-3 w-3" />
        {messages.improvementActions.addLog}
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium">{messages.improvementActions.addLog}</p>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={messages.improvementActions.addLogPlaceholder}
        className="w-full rounded border bg-background px-3 py-1.5 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && note.trim()) handleSave()
        }}
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={!note.trim() || saving}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? messages.common.loading : messages.common.save}
        </button>
        <button
          onClick={() => { setOpen(false); setNote("") }}
          className="rounded px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          {messages.common.cancel}
        </button>
      </div>
    </div>
  )
}
