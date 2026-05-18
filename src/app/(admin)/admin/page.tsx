import Link from "next/link"
import { Suspense } from "react"
import { getAllClinics, getClinicHealthBatch } from "@/lib/queries/clinics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  Lightbulb,
  HardDrive,
  SmilePlus,
  Megaphone,
  MessageSquare,
  Mail,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  ChevronDown,
  Trophy,
} from "lucide-react"
import { SpecialPlanUrl, GuideUrl } from "@/components/admin/special-plan-url"
import { ClinicSearch } from "@/components/admin/clinic-search"
import { ClinicRow } from "@/components/admin/clinic-row"
import { PxValueDashboard } from "@/components/admin/px-value-dashboard"
import { AddClinicDialog } from "@/components/admin/add-clinic-dialog"
import type { ClinicSettings, PlanTier } from "@/types"

function ScoreBadge({ score, prevScore }: { score: number | null; prevScore: number | null }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const scoreColor = score >= 4.0
    ? "text-emerald-700 bg-emerald-50"
    : score >= 3.0
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50"

  const delta = prevScore != null ? score - prevScore : null

  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${scoreColor}`}>
        {score.toFixed(1)}
      </span>
      {delta != null && delta !== 0 && (
        <span className={`flex items-center text-[10px] font-medium ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {delta > 0 ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function ClinicStatusIndicator({ todayCount, lastResponseAt, avgScore }: {
  todayCount: number
  lastResponseAt: Date | null
  avgScore: number | null
}) {
  if (!lastResponseAt) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        未稼働
      </div>
    )
  }

  const daysSinceLastResponse = Math.floor(
    (Date.now() - new Date(lastResponseAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastResponse >= 7) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-red-500">
        <AlertTriangle className="h-3 w-3" />
        {daysSinceLastResponse}日間停止
      </div>
    )
  }

  if (avgScore != null && avgScore < 3.5) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-amber-600">
        <AlertTriangle className="h-3 w-3" />
        要注意
      </div>
    )
  }

  if (todayCount > 0) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-emerald-600">
        <Activity className="h-3 w-3" />
        稼働中
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
      本日未稼働
    </div>
  )
}

const MANAGEMENT_TOOLS: Array<{
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}> = [
  {
    href: "/admin/tips",
    icon: Lightbulb,
    label: "Tips",
    color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
  },
  {
    href: "/admin/comments",
    icon: MessageSquare,
    label: "コメント",
    color: "bg-teal-50 text-teal-600 hover:bg-teal-100",
  },
  {
    href: "/admin/email-templates",
    icon: Mail,
    label: "メール文面",
    color: "bg-sky-50 text-sky-600 hover:bg-sky-100",
  },
  {
    href: "/admin/improvement-actions",
    icon: Megaphone,
    label: "改善アクション",
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
  {
    href: "/admin/kawaii-teeth",
    icon: SmilePlus,
    label: "Kawaii Teeth",
    color: "bg-pink-50 text-pink-600 hover:bg-pink-100",
  },
  {
    href: "/admin/backups",
    icon: HardDrive,
    label: "バックアップ",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
]

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const search = params.search ?? ""

  const { clinics, total, totalPages } = await getAllClinics({ page, limit: 20, search })

  const clinicIds = clinics.map((c) => c.id)
  const healthMap = await getClinicHealthBatch(clinicIds)

  function paginationHref(targetPage: number) {
    const params = new URLSearchParams()
    if (targetPage > 1) params.set("page", String(targetPage))
    if (search) params.set("search", search)
    const qs = params.toString()
    return `/admin${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-5">
      {/* Header row: title + management tools */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">{messages.admin.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {MANAGEMENT_TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${tool.color}`}
                title={tool.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tool.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Clinic list (primary view) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">
                {messages.admin.clinicList}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  全{total}院
                </span>
              </CardTitle>
              <AddClinicDialog />
            </div>
            <div className="w-full sm:w-72">
              <Suspense>
                <ClinicSearch />
              </Suspense>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? `「${search}」に一致するクリニックはありません` : messages.common.noData}
            </p>
          ) : (
            <div className="space-y-2">
              {clinics.map((clinic) => {
                const health = healthMap.get(clinic.id)
                const clinicSettings = (clinic.settings ?? {}) as ClinicSettings
                const clinicPlan = (clinicSettings.plan ?? "free") as PlanTier
                return (
                  <ClinicRow key={clinic.id} clinicId={clinic.id} clinicName={clinic.name} plan={clinicPlan} ownerUserId={clinic.ownerUserId} ownerName={clinic.owner?.name} ownerEmail={clinic.owner?.email} ownerEmailVerified={clinic.owner?.emailVerified ? true : clinic.owner ? false : null}>
                    {/* Compact single-row: name + slug + status + inline metrics */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{clinic.name}</h3>
                        <span className="text-[11px] text-muted-foreground">/{clinic.slug}</span>
                        {health && (
                          <ClinicStatusIndicator
                            todayCount={health.todayCount}
                            lastResponseAt={health.lastResponseAt}
                            avgScore={health.avgScore}
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:ml-auto">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-muted-foreground">満足度</span>
                          <ScoreBadge
                            score={health?.avgScore ?? null}
                            prevScore={health?.prevMonthAvg ?? null}
                          />
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          本日 <span className="font-bold text-foreground">{health?.todayCount ?? 0}</span>件
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          今月 <span className="font-bold text-foreground">{health?.thisMonthCount ?? 0}</span>件
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {messages.common.staffLabel} <span className="font-bold text-foreground">{clinic._count.staff}</span>人
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          総回答 <span className="font-bold text-foreground">{clinic._count.surveyResponses.toLocaleString()}</span>件
                        </div>
                      </div>
                    </div>
                  </ClinicRow>
                )
              })}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                {total}件中 {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)}件
              </p>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={paginationHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    前へ
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 1) return true
                    return false
                  })
                  .reduce<Array<number | "ellipsis">>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("ellipsis")
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={paginationHref(item as number)}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                          item === page
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-muted"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}
                {page < totalPages && (
                  <Link
                    href={paginationHref(page + 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    次へ
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secondary section: collapsible resources */}
      <details className="group rounded-lg border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium hover:bg-muted/40">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            PX-Value ランキング・登録URL
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t p-4">
          <SpecialPlanUrl />
          <GuideUrl />
          <Suspense>
            <PxValueDashboard />
          </Suspense>
        </div>
      </details>
    </div>
  )
}
