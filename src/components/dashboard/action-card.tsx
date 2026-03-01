"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import { CATEGORY_LABELS } from "@/lib/constants"
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  CalendarClock,
  BarChart3,
  Tag,
  Megaphone,
  Users,
  Lock,
} from "lucide-react"
import type { ActionCardProps } from "./action-shared"
import { QuestionSelect, SelectedQuestionsScores } from "./action-shared"
import { ActionTimeline, AddLogForm } from "./action-timeline"

export function ActionCard({
  action,
  expanded,
  onToggle,
  onStatusChange,
  onDelete,
  onLogUpdated,
  onLogAdded,
  loading,
  currentQuestionScore,
  questionLabel,
  category,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  editTitle,
  editDescription,
  editQuestionIds,
  onEditTitleChange,
  onEditDescriptionChange,
  onEditSelectQuestion,
  templateQuestions,
  questionScores,
  allQuestions,
  isSystemAdmin,
  monthlyMetrics,
  seasonalIndices,
  platformActionOutcomes,
  isDemo,
  isOwner,
}: ActionCardProps) {
  const isActive = action.status === "active"
  const isCompleted = action.status === "completed"

  // Completion dialog state
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completionReason, setCompletionReason] = useState<string>("")
  const [completionNote, setCompletionNote] = useState("")

  // Elapsed days since start
  const elapsedDays = useMemo(() => {
    const start = new Date(action.startedAt)
    const end = action.completedAt ? new Date(action.completedAt) : new Date()
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, [action.startedAt, action.completedAt])

  // Business metrics comparison: start month vs latest month
  const metricsComparison = useMemo(() => {
    if (!monthlyMetrics || monthlyMetrics.length < 2) return null
    const startDate = new Date(action.startedAt)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1 // 1-based

    // Find the metric for the start month (or closest earlier)
    const startMetric = monthlyMetrics
      .filter((m) => m.year < startYear || (m.year === startYear && m.month <= startMonth))
      .at(-1)

    // Latest metric (must be different from start)
    const latestMetric = monthlyMetrics.at(-1)

    if (!startMetric || !latestMetric) return null
    if (startMetric.year === latestMetric.year && startMetric.month === latestMetric.month) return null

    // 季節指数
    const hasSeasonalData = seasonalIndices && seasonalIndices.level !== "none"
    const revIdxStart = seasonalIndices?.revenue.byMonth[startMetric.month] ?? 1.0
    const revIdxLatest = seasonalIndices?.revenue.byMonth[latestMetric.month] ?? 1.0
    const patIdxStart = seasonalIndices?.patientCount.byMonth[startMetric.month] ?? 1.0
    const patIdxLatest = seasonalIndices?.patientCount.byMonth[latestMetric.month] ?? 1.0

    const items: Array<{
      label: string
      startValue: string
      latestValue: string
      changeText: string
      changeType: "positive" | "negative" | "neutral"
      seasonalChangeText?: string | null
      seasonalChangeType?: "positive" | "negative" | "neutral"
    }> = []

    // Total revenue
    if (startMetric.totalRevenue != null && latestMetric.totalRevenue != null) {
      const pct = startMetric.totalRevenue > 0
        ? ((latestMetric.totalRevenue - startMetric.totalRevenue) / startMetric.totalRevenue) * 100
        : 0
      // 季節調整済み変化率
      let seasonalPct: number | null = null
      if (hasSeasonalData && startMetric.totalRevenue > 0 && revIdxStart > 0 && revIdxLatest > 0) {
        const normStart = startMetric.totalRevenue / revIdxStart
        const normEnd = latestMetric.totalRevenue / revIdxLatest
        seasonalPct = ((normEnd - normStart) / normStart) * 100
      }
      items.push({
        label: messages.improvementActions.metricsRevenue,
        startValue: `${Math.round(startMetric.totalRevenue)}`,
        latestValue: `${Math.round(latestMetric.totalRevenue)}`,
        changeText: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
        changeType: pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral",
        seasonalChangeText: seasonalPct != null ? `${seasonalPct >= 0 ? "+" : ""}${seasonalPct.toFixed(1)}%` : null,
        seasonalChangeType: seasonalPct != null ? (seasonalPct > 0 ? "positive" : seasonalPct < 0 ? "negative" : "neutral") : undefined,
      })
    }

    // Total patient count
    if (startMetric.totalPatientCount != null && latestMetric.totalPatientCount != null) {
      const diff = latestMetric.totalPatientCount - startMetric.totalPatientCount
      // 季節調整済み変化
      let seasonalDiff: number | null = null
      if (hasSeasonalData && patIdxStart > 0 && patIdxLatest > 0) {
        const normStart = startMetric.totalPatientCount / patIdxStart
        const normEnd = latestMetric.totalPatientCount / patIdxLatest
        seasonalDiff = Math.round(normEnd - normStart)
      }
      items.push({
        label: messages.improvementActions.metricsPatients,
        startValue: `${startMetric.totalPatientCount}`,
        latestValue: `${latestMetric.totalPatientCount}`,
        changeText: `${diff >= 0 ? "+" : ""}${diff}`,
        changeType: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
        seasonalChangeText: seasonalDiff != null ? `${seasonalDiff >= 0 ? "+" : ""}${seasonalDiff}` : null,
        seasonalChangeType: seasonalDiff != null ? (seasonalDiff > 0 ? "positive" : seasonalDiff < 0 ? "negative" : "neutral") : undefined,
      })
    }

    // Cancellation rate
    const startCancelRate = startMetric.cancellationCount != null && startMetric.totalVisitCount
      ? (startMetric.cancellationCount / startMetric.totalVisitCount) * 100
      : null
    const latestCancelRate = latestMetric.cancellationCount != null && latestMetric.totalVisitCount
      ? (latestMetric.cancellationCount / latestMetric.totalVisitCount) * 100
      : null
    if (startCancelRate != null && latestCancelRate != null) {
      const diff = latestCancelRate - startCancelRate
      items.push({
        label: messages.improvementActions.metricsCancelRate,
        startValue: `${startCancelRate.toFixed(1)}%`,
        latestValue: `${latestCancelRate.toFixed(1)}%`,
        changeText: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pt`,
        changeType: diff < 0 ? "positive" : diff > 0 ? "negative" : "neutral", // lower is better
      })
    }

    if (items.length === 0) return null

    return {
      items,
      startLabel: `${startMetric.year}/${startMetric.month}`,
      latestLabel: `${latestMetric.year}/${latestMetric.month}`,
      seasonalLevel: seasonalIndices?.level ?? "none",
      seasonalLabel: seasonalIndices?.label ?? null,
    }
  }, [monthlyMetrics, action.startedAt, seasonalIndices])

  // For active: compare baseline vs current question score
  // For completed: compare baseline vs resultScore (auto-captured at completion)
  const compareScore = isActive ? (currentQuestionScore ?? null) : (action.resultScore ?? null)
  const scoreChange =
    compareScore != null && action.baselineScore != null
      ? Math.round((compareScore - action.baselineScore) * 10) / 10
      : null

  const categoryLabel = category ? CATEGORY_LABELS[category] : null

  return (
    <Card
      className={
        isActive
          ? "border-blue-200 bg-gradient-to-r from-blue-50/30 to-white"
          : isCompleted
            ? "border-green-200 bg-gradient-to-r from-green-50/30 to-white"
            : "opacity-60"
      }
    >
      <CardContent className="py-4">
        <button
          onClick={onToggle}
          className="flex w-full items-start justify-between text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-sm font-medium truncate">{action.title}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-6">
              {action.platformActionId && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                  <Megaphone className="h-2.5 w-2.5" />
                  {messages.platformActions.fromPlatform}
                </span>
              )}
              {categoryLabel && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Tag className="h-2.5 w-2.5" />
                  {categoryLabel}
                </span>
              )}
              {isActive && elapsedDays > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100/70 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <CalendarClock className="h-2.5 w-2.5" />
                  {elapsedDays}{messages.improvementActions.elapsedDays}
                </span>
              )}
              {(questionLabel || action.targetQuestion) && (
                <span className="text-xs text-muted-foreground truncate">
                  {questionLabel || action.targetQuestion}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Score change badge */}
            {scoreChange !== null && (
              <div
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  scoreChange > 0
                    ? "bg-green-100 text-green-700"
                    : scoreChange < 0
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {scoreChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : scoreChange < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {scoreChange > 0 ? "+" : ""}
                {scoreChange}
              </div>
            )}
            {/* Score pills */}
            {action.baselineScore != null && (
              <span className="text-xs text-muted-foreground">
                {action.baselineScore}
                {compareScore != null ? ` → ${compareScore}` : ""}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && !isEditing && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {action.description && (
              <p className="text-sm text-muted-foreground">{action.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                {messages.improvementActions.startedAt}:{" "}
                {new Date(action.startedAt).toLocaleDateString("ja-JP")}
              </span>
              {action.completedAt && (
                <span>
                  {messages.improvementActions.completedAt}:{" "}
                  {new Date(action.completedAt).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>

            {/* History timeline */}
            {action.logs && action.logs.length > 0 && (
              <ActionTimeline logs={action.logs} onLogUpdated={(updatedLog) => onLogUpdated(action.id, updatedLog)} />
            )}

            {/* Score comparison: baseline → current/completion */}
            {action.baselineScore != null && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    {messages.improvementActions.baselineScore}
                  </p>
                  <p className="text-lg font-bold">{action.baselineScore}</p>
                  <p className="text-[9px] text-muted-foreground/60">
                    {messages.improvementActions.baselineScoreNote}
                  </p>
                </div>
                {isActive && currentQuestionScore != null && (
                  <div className="rounded-lg bg-blue-50 p-2 text-center">
                    <p className="text-[10px] text-blue-600">
                      {messages.improvementActions.currentScore}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {currentQuestionScore}
                    </p>
                    <p className="text-[9px] text-blue-500/60">
                      {messages.improvementActions.currentScoreNote}
                    </p>
                  </div>
                )}
                {!isActive && action.resultScore != null && (
                  <div
                    className={`rounded-lg p-2 text-center ${
                      action.resultScore >= action.baselineScore
                        ? "bg-green-50"
                        : "bg-orange-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {messages.improvementActions.completionScore}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {action.resultScore}
                    </p>
                    <p
                      className={`text-[9px] ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-500/60"
                          : "text-orange-500/60"
                      }`}
                    >
                      {messages.improvementActions.completionScoreNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Business metrics comparison — オーナーのみ表示 */}
            {isOwner && metricsComparison && (
              <div className={`rounded-lg p-3 space-y-2 ${isDemo ? "bg-slate-50/40 border border-dashed border-slate-200" : "border border-slate-200 bg-slate-50/50"}`}>
                <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 flex-wrap">
                  <BarChart3 className="h-3 w-3" />
                  {messages.improvementActions.metricsTitle}
                  <span className="font-normal text-slate-400 ml-1">
                    {metricsComparison.startLabel} → {metricsComparison.latestLabel}
                  </span>
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                    <Lock className="h-2 w-2" />
                    {messages.improvementActions.metricsOwnerOnly}
                  </span>
                  {isDemo && (
                    <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-600">
                      {messages.platformActions.outcomeSampleBadge}
                    </span>
                  )}
                </p>
                <div className={`grid gap-2 ${metricsComparison.items.length === 3 ? "grid-cols-3" : metricsComparison.items.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {metricsComparison.items.map((item) => (
                    <div key={item.label} className="rounded-md bg-white p-2 text-center">
                      <p className="text-[9px] text-slate-500">{item.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {item.startValue} → <span className="font-semibold">{item.latestValue}</span>
                        {item.label === messages.improvementActions.metricsRevenue && (
                          <span className="text-[9px] text-slate-400 ml-0.5">{messages.improvementActions.metricsRevenueUnit}</span>
                        )}
                      </p>
                      <p className={`text-[11px] font-bold mt-0.5 ${
                        item.changeType === "positive" ? "text-green-600" :
                        item.changeType === "negative" ? "text-red-500" :
                        "text-slate-400"
                      }`}>
                        {item.changeText}
                        {item.seasonalChangeText && (
                          <span className="font-normal text-[9px] text-slate-400 ml-1">
                            ({messages.improvementActions.metricsSeasonalRaw})
                          </span>
                        )}
                      </p>
                      {item.seasonalChangeText && (
                        <p className={`text-[10px] font-semibold mt-0.5 ${
                          item.seasonalChangeType === "positive" ? "text-blue-600" :
                          item.seasonalChangeType === "negative" ? "text-orange-500" :
                          "text-slate-400"
                        }`}>
                          {item.seasonalChangeText}
                          <span className="font-normal text-[9px] text-slate-400 ml-1">
                            ({messages.improvementActions.metricsSeasonalAdjusted})
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-slate-400">
                    {isDemo ? messages.improvementActions.metricsSampleNote : messages.improvementActions.metricsNote}
                  </p>
                  {metricsComparison.seasonalLevel !== "none" && metricsComparison.seasonalLabel && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] text-blue-600">
                      <CalendarClock className="h-2 w-2" />
                      {metricsComparison.seasonalLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
            {isOwner && !metricsComparison && expanded && monthlyMetrics && monthlyMetrics.length < 2 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  <BarChart3 className="inline h-3 w-3 mr-1" />
                  {messages.improvementActions.metricsEmpty}
                </p>
              </div>
            )}
            {!isOwner && expanded && (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/30 p-3 text-center">
                <p className="text-[11px] text-amber-600 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  {messages.improvementActions.metricsOwnerOnlyHint}
                </p>
              </div>
            )}

            {/* 他院実績（プラットフォームアクションにリンクされている場合） */}
            {action.platformActionId && platformActionOutcomes && (() => {
              const outcome = platformActionOutcomes[action.platformActionId!]
              if (!outcome || outcome.confidence === "insufficient") return null
              return (
                <div className={`rounded-lg px-3 py-2 space-y-1.5 ${isDemo ? "bg-purple-50/40 border border-dashed border-purple-200" : "bg-purple-50/60 border border-purple-100"}`}>
                  <p className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {messages.platformActions.outcomeTitle}
                    <span className="font-normal text-purple-500 ml-1">
                      {outcome.qualifiedCount}{messages.platformActions.outcomeClinics}
                    </span>
                    {outcome.confidence === "high" ? (
                      <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                        {messages.platformActions.confidenceHigh}
                      </span>
                    ) : (
                      <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                        {messages.platformActions.confidenceModerate}
                      </span>
                    )}
                    {isDemo && (
                      <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-600">
                        {messages.platformActions.outcomeSampleBadge}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {outcome.avgScoreImprovement != null && (
                      <div className="text-center">
                        <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeScore}</p>
                        <p className={`text-xs font-bold ${outcome.avgScoreImprovement > 0 ? "text-green-600" : outcome.avgScoreImprovement < 0 ? "text-red-500" : "text-slate-400"}`}>
                          {outcome.avgScoreImprovement > 0 ? "+" : ""}{outcome.avgScoreImprovement}
                        </p>
                      </div>
                    )}
                    {outcome.avgDurationDays != null && (
                      <div className="text-center">
                        <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeDuration}</p>
                        <p className="text-xs font-bold text-slate-600">
                          {outcome.avgDurationDays < 60
                            ? `${outcome.avgDurationDays}${messages.platformActions.outcomeDaysUnit}`
                            : `${(outcome.avgDurationDays / 30).toFixed(1)}${messages.platformActions.outcomeMonthsUnit}`
                          }
                        </p>
                      </div>
                    )}
                    {outcome.establishedRate != null && (
                      <div className="text-center">
                        <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeEstablished}</p>
                        <p className={`text-xs font-bold ${outcome.establishedRate >= 70 ? "text-green-600" : outcome.establishedRate >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                          {outcome.establishedRate}%
                        </p>
                      </div>
                    )}
                  </div>
                  {isDemo && (
                    <p className="text-[9px] text-orange-500/70">{messages.platformActions.outcomeSampleNote}</p>
                  )}
                </div>
              )
            })()}

            {/* Completion reason (shown for completed actions) */}
            {!isActive && action.completionReason && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <p>
                  <span className="font-medium">{messages.improvementActions.completionReasonLabel}: </span>
                  {action.completionReason === "established" && `✅ ${messages.improvementActions.completionReasonEstablished}`}
                  {action.completionReason === "uncertain" && `🔄 ${messages.improvementActions.completionReasonUncertain}`}
                  {action.completionReason === "suspended" && `⏸️ ${messages.improvementActions.completionReasonSuspended}`}
                </p>
                {action.completionNote && (
                  <p>
                    <span className="font-medium">{messages.improvementActions.completionNoteLabel}: </span>
                    {action.completionNote}
                  </p>
                )}
              </div>
            )}

            {/* Add progress note */}
            {isActive && (
              <AddLogForm actionId={action.id} onLogAdded={onLogAdded} />
            )}

            {/* Actions */}
            {isActive && !showCompletionDialog && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowCompletionDialog(true)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.complete}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(action.id, "cancelled")}
                  disabled={loading}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.cancel}
                </Button>
              </div>
            )}

            {/* Completion confirmation dialog */}
            {isActive && showCompletionDialog && (
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">{messages.improvementActions.completionDialogTitle}</p>
                  <p className="text-xs text-muted-foreground">{messages.improvementActions.completionDialogDesc}</p>
                </div>
                <div className="space-y-2">
                  {([
                    { value: "established", label: messages.improvementActions.completionReasonEstablished, desc: messages.improvementActions.completionReasonEstablishedDesc, icon: "✅" },
                    { value: "uncertain", label: messages.improvementActions.completionReasonUncertain, desc: messages.improvementActions.completionReasonUncertainDesc, icon: "🔄" },
                    { value: "suspended", label: messages.improvementActions.completionReasonSuspended, desc: messages.improvementActions.completionReasonSuspendedDesc, icon: "⏸️" },
                  ] as const).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${
                        completionReason === option.value
                          ? "border-green-400 bg-white ring-1 ring-green-400"
                          : "border-gray-200 bg-white hover:border-green-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`completion-${action.id}`}
                        value={option.value}
                        checked={completionReason === option.value}
                        onChange={() => setCompletionReason(option.value)}
                        className="mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          <span className="mr-1">{option.icon}</span>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Input
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder={messages.improvementActions.completionNotePlaceholder}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onStatusChange(action.id, "completed", {
                        completionReason,
                        completionNote: completionNote.trim() || undefined,
                      })
                      setShowCompletionDialog(false)
                      setCompletionReason("")
                      setCompletionNote("")
                    }}
                    disabled={!completionReason || loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {messages.improvementActions.complete}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCompletionDialog(false)
                      setCompletionReason("")
                      setCompletionNote("")
                    }}
                  >
                    {messages.common.cancel}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(action.id, "active")}
                  disabled={loading}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.reactivate}
                </Button>
              )}
              {onStartEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onStartEdit() }}
                  disabled={loading}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.editAction}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(action.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {messages.improvementActions.delete}
              </Button>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {expanded && isEditing && onCancelEdit && onSaveEdit && onEditTitleChange && onEditDescriptionChange && (
          <div className="mt-3 space-y-4 border-t pt-3">
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.actionTitle}</Label>
              <Input
                value={editTitle ?? ""}
                onChange={(e) => onEditTitleChange(e.target.value)}
                placeholder={messages.improvementActions.actionTitlePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.description}</Label>
              <Input
                value={editDescription ?? ""}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
                placeholder={messages.improvementActions.descriptionPlaceholder}
              />
            </div>
            {isSystemAdmin && onEditSelectQuestion && templateQuestions && questionScores && allQuestions && editQuestionIds && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {messages.improvementActions.selectQuestion}
                  </Label>
                  <QuestionSelect
                    templateQuestions={templateQuestions}
                    selectedId={Array.from(editQuestionIds)[0] ?? ""}
                    questionScores={questionScores}
                    onSelect={onEditSelectQuestion}
                  />
                </div>
                {editQuestionIds.size > 0 && (
                  <SelectedQuestionsScores
                    selectedIds={editQuestionIds}
                    questionScores={questionScores}
                    allQuestions={allQuestions}
                  />
                )}
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={onSaveEdit} disabled={!(editTitle?.trim()) || loading}>
                {loading ? messages.common.loading : messages.common.save}
              </Button>
              <Button variant="ghost" onClick={onCancelEdit}>
                {messages.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
