"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Mail, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X, Send, RefreshCw } from "lucide-react"
import { messages } from "@/lib/messages"

type EmailType =
  | "verification"
  | "resend_verification"
  | "welcome"
  | "reminder"
  | "weekly_summary"
  | "password_reset"

interface EmailLogRow {
  id: string
  type: EmailType
  to: string
  subject: string
  status: "sent" | "failed"
  errorMessage: string | null
  sentAt: string
}

interface EmailLogDetail extends EmailLogRow {
  html: string
  providerMessageId: string | null
  clinicId: string | null
  userId: string | null
}

interface EmailLogsViewProps {
  clinicId: string
}

const TYPE_LABEL: Record<EmailType, string> = {
  verification: messages.emailLogs.typeVerification,
  resend_verification: messages.emailLogs.typeResendVerification,
  welcome: messages.emailLogs.typeWelcome,
  reminder: messages.emailLogs.typeReminder,
  weekly_summary: messages.emailLogs.typeWeeklySummary,
  password_reset: messages.emailLogs.typePasswordReset,
}

const TYPE_COLOR: Record<EmailType, string> = {
  verification: "bg-sky-50 text-sky-700",
  resend_verification: "bg-sky-50 text-sky-700",
  welcome: "bg-emerald-50 text-emerald-700",
  reminder: "bg-amber-50 text-amber-700",
  weekly_summary: "bg-violet-50 text-violet-700",
  password_reset: "bg-rose-50 text-rose-700",
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EmailLogsView({ clinicId }: EmailLogsViewProps) {
  const [logs, setLogs] = useState<EmailLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPeriod, setFilterPeriod] = useState<string>("all")

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        type: filterType,
        status: filterStatus,
        period: filterPeriod,
        page: String(page),
      })
      const res = await fetch(`/api/admin/clinics/${clinicId}/email-logs?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || messages.emailLogs.loadFailed)
        setLogs([])
        return
      }
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError(messages.emailLogs.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [clinicId, filterType, filterStatus, filterPeriod, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // フィルタ変更時はページを1に戻す
  useEffect(() => {
    setPage(1)
  }, [filterType, filterStatus, filterPeriod])

  return (
    <div className="space-y-4">
      {/* フィルタ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {messages.emailLogs.filterType}
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          >
            <option value="all">{messages.emailLogs.typeAll}</option>
            <option value="verification">{TYPE_LABEL.verification}</option>
            <option value="resend_verification">{TYPE_LABEL.resend_verification}</option>
            <option value="welcome">{TYPE_LABEL.welcome}</option>
            <option value="reminder">{TYPE_LABEL.reminder}</option>
            <option value="weekly_summary">{TYPE_LABEL.weekly_summary}</option>
            <option value="password_reset">{TYPE_LABEL.password_reset}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {messages.emailLogs.filterStatus}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          >
            <option value="all">{messages.emailLogs.statusAll}</option>
            <option value="sent">{messages.emailLogs.statusSent}</option>
            <option value="failed">{messages.emailLogs.statusFailed}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {messages.emailLogs.filterPeriod}
          </label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          >
            <option value="all">{messages.emailLogs.periodAll}</option>
            <option value="7">{messages.emailLogs.period7}</option>
            <option value="30">{messages.emailLogs.period30}</option>
            <option value="90">{messages.emailLogs.period90}</option>
          </select>
        </div>
      </div>

      {/* 一覧 */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{messages.emailLogs.noLogs}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(log.id)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLOR[log.type]}`}
                        >
                          {TYPE_LABEL[log.type] ?? log.type}
                        </span>
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {messages.emailLogs.statusSent}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700"
                            title={log.errorMessage ?? undefined}
                          >
                            <AlertCircle className="h-3 w-3" />
                            {messages.emailLogs.statusFailed}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {log.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {log.to}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(log.sentAt)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            {total}件中 {(page - 1) * 50 + 1}〜{Math.min(page * 50, total)}件
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              前へ
            </button>
            <span className="px-2 text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-muted disabled:opacity-40"
            >
              次へ
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {selectedId && (
        <EmailLogDetailModal
          logId={selectedId}
          onClose={() => setSelectedId(null)}
          onResent={fetchLogs}
        />
      )}
    </div>
  )
}

function EmailLogDetailModal({
  logId,
  onClose,
  onResent,
}: {
  logId: string
  onClose: () => void
  onResent: () => void
}) {
  const [log, setLog] = useState<EmailLogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/email-logs/${logId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          if (!cancelled) setError(data.error || messages.emailLogs.loadFailed)
          return
        }
        const data = await res.json()
        if (!cancelled) setLog(data.log)
      } catch {
        if (!cancelled) setError(messages.emailLogs.loadFailed)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [logId])

  async function handleResend() {
    if (!log) return
    if (!confirm(messages.emailLogs.resendConfirm.replace("{to}", log.to))) return
    setResending(true)
    setResendResult(null)
    try {
      const res = await fetch(`/api/admin/email-logs/${log.id}/resend`, { method: "POST" })
      if (res.ok) {
        setResendResult({ ok: true, message: messages.emailLogs.resendSuccess })
        onResent()
      } else {
        const data = await res.json().catch(() => ({}))
        setResendResult({ ok: false, message: data.error || messages.emailLogs.resendFailed })
      }
    } catch {
      setResendResult({ ok: false, message: messages.emailLogs.resendFailed })
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Mail className="h-4 w-4 text-sky-500" />
            {messages.emailLogs.bodyTitle}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted" aria-label={messages.common.close}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : log ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-2 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-muted-foreground">{messages.emailLogs.sentAt}</dt>
                  <dd>{formatDateTime(log.sentAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">{messages.emailLogs.type}</dt>
                  <dd>{TYPE_LABEL[log.type] ?? log.type}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">{messages.emailLogs.to}</dt>
                  <dd className="break-all">{log.to}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">{messages.emailLogs.status}</dt>
                  <dd>
                    {log.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {messages.emailLogs.statusSent}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        {messages.emailLogs.statusFailed}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-muted-foreground">{messages.emailLogs.subject}</dt>
                  <dd>{log.subject}</dd>
                </div>
                {log.providerMessageId && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground">{messages.emailLogs.providerMessageId}</dt>
                    <dd className="break-all font-mono text-[11px]">{log.providerMessageId}</dd>
                  </div>
                )}
                {log.errorMessage && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground">{messages.emailLogs.errorMessage}</dt>
                    <dd className="break-all text-red-700">{log.errorMessage}</dd>
                  </div>
                )}
              </dl>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {messages.emailLogs.bodyTitle}
                </p>
                <iframe
                  sandbox=""
                  srcDoc={log.html}
                  className="h-96 w-full rounded-lg border bg-white"
                  title={messages.emailLogs.bodyTitle}
                />
              </div>
            </div>
          ) : null}
        </div>

        {log && (
          <div className="flex items-center justify-between gap-3 border-t p-4">
            <div className="text-xs">
              {resendResult && (
                <span className={resendResult.ok ? "text-emerald-600" : "text-destructive"}>
                  {resendResult.message}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                {messages.common.close}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    {messages.emailLogs.resending}
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    {messages.emailLogs.resendButton}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
