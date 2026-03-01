"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import type { SeasonalIndices } from "@/lib/queries/seasonal-index"
import { MIN_CLINICS_FOR_DISPLAY } from "@/lib/queries/platform-action-stats"
import type { PlatformActionOutcome } from "@/lib/queries/platform-action-stats"
import type { TemplateData } from "@/types"
import {
  QUESTION_CATEGORY_MAP,
  IMPROVEMENT_SUGGESTIONS,
  CATEGORY_LABELS,
} from "@/lib/constants"
import type { ImprovementSuggestion } from "@/lib/constants"
import { getDemoSuggestionOutcome } from "@/lib/demo-action-outcomes"
import {
  Plus,
  Target,
  Lightbulb,
  Pencil,
  AlertTriangle,
  BarChart3,
  Megaphone,
  ExternalLink,
  Check,
  Sparkles,
  Users,
} from "lucide-react"

import type {
  ImprovementAction,
  ActionLog,
  PlatformActionData,
  MonthlyMetric,
} from "./action-shared"
import {
  parseQuestionIds,
  QuestionSelect,
  SelectedQuestionsScores,
  RotatingTip,
} from "./action-shared"
import { ActionCard } from "./action-card"

// Re-export types for consumers
export type { ImprovementAction, ActionLog, PlatformActionData, MonthlyMetric }

interface Props {
  initialActions: ImprovementAction[]
  templateQuestions?: TemplateData[]
  questionScores?: Record<string, number>
  platformActions?: PlatformActionData[]
  adoptedPlatformActionIds?: string[]
  isSystemAdmin?: boolean
  monthlyMetrics?: MonthlyMetric[]
  seasonalIndices?: SeasonalIndices
  platformActionOutcomes?: Record<string, PlatformActionOutcome>
  isDemo?: boolean
  isOwner?: boolean
}

export function ImprovementActionsView({
  initialActions,
  templateQuestions = [],
  questionScores = {},
  platformActions = [],
  adoptedPlatformActionIds: initialAdopted = [],
  isSystemAdmin = false,
  monthlyMetrics = [],
  seasonalIndices,
  platformActionOutcomes = {},
  isDemo = false,
  isOwner = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actions, setActions] = useState(initialActions)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set(initialAdopted))
  const [adoptingId, setAdoptingId] = useState<string | null>(null)
  const [adoptQuestionSelect, setAdoptQuestionSelect] = useState<{ platformActionId: string; questionIds: string[] } | null>(null)
  const [selectedAdoptQuestionId, setSelectedAdoptQuestionId] = useState("")

  // Form state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editQuestionIds, setEditQuestionIds] = useState<Set<string>>(new Set())

  // All questions flattened for lookup
  const allQuestions = useMemo(() => {
    const map = new Map<string, { text: string; templateName: string }>()
    for (const t of templateQuestions) {
      for (const q of t.questions) {
        map.set(q.id, { text: q.text, templateName: t.name })
      }
    }
    return map
  }, [templateQuestions])

  // Auto-open form with pre-selected question from URL param (?question=fv2) — system_admin only
  useEffect(() => {
    const questionParam = searchParams.get("question")
    if (questionParam && allQuestions.has(questionParam)) {
      setShowForm(true)
      if (isSystemAdmin) {
        setSelectedQuestionIds(new Set([questionParam]))
      }
      // Clean up URL
      router.replace("/dashboard/actions", { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build title→outcome map for suggestion cards
  // デモ時は全提案にサンプルデータを表示
  const suggestionOutcomeMap = useMemo(() => {
    const map = new Map<string, PlatformActionOutcome>()
    for (const pa of platformActions) {
      const outcome = platformActionOutcomes[pa.id]
      if (outcome) map.set(pa.title, outcome)
    }
    if (isDemo) {
      // デモ: プラットフォームアクションにマッチしない提案にもサンプルデータを追加
      for (const category of Object.values(IMPROVEMENT_SUGGESTIONS)) {
        for (const suggestion of category) {
          if (!map.has(suggestion.title)) {
            const demoOutcome = getDemoSuggestionOutcome(suggestion.title)
            if (demoOutcome) map.set(suggestion.title, demoOutcome)
          }
        }
      }
    }
    return map
  }, [platformActions, platformActionOutcomes, isDemo])

  // Get suggestions based on selected questions' categories
  // Sort: suggestions with outcome data first
  const suggestions = useMemo((): ImprovementSuggestion[] => {
    if (selectedQuestionIds.size === 0) return []
    const seen = new Set<string>()
    const result: ImprovementSuggestion[] = []
    for (const qId of Array.from(selectedQuestionIds)) {
      const category = QUESTION_CATEGORY_MAP[qId]
      if (!category || seen.has(category)) continue
      seen.add(category)
      const items = IMPROVEMENT_SUGGESTIONS[category] ?? []
      result.push(...items)
    }
    // Sort: suggestions with sufficient outcome data first, then by adoptCount
    return result.sort((a, b) => {
      const oa = suggestionOutcomeMap.get(a.title)
      const ob = suggestionOutcomeMap.get(b.title)
      const scoreA = oa ? (oa.confidence !== "insufficient" ? 2 : 1) : 0
      const scoreB = ob ? (ob.confidence !== "insufficient" ? 2 : 1) : 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return (ob?.adoptCount ?? 0) - (oa?.adoptCount ?? 0)
    })
  }, [selectedQuestionIds, suggestionOutcomeMap])

  function handleSelectQuestion(questionId: string) {
    setSelectedQuestionIds(questionId ? new Set([questionId]) : new Set())
    // Reset title/description when changing question
    setTitle("")
    setDescription("")
  }

  function handleSelectSuggestion(suggestion: ImprovementSuggestion) {
    setTitle(suggestion.title)
    setDescription(suggestion.description)
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setSelectedQuestionIds(new Set())
  }

  async function handleCreate() {
    if (!title.trim() || loading) return
    setLoading(true)
    setErrorMsg(null)

    // Build comma-separated question IDs and texts
    const qIds = Array.from(selectedQuestionIds)
    const targetQuestionId = qIds.length > 0 ? qIds.join(",") : undefined
    const targetQuestionText = qIds.length > 0
      ? qIds.map((id) => allQuestions.get(id)?.text).filter(Boolean).join("、")
      : undefined

    try {
      const res = await fetch("/api/improvement-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetQuestion: targetQuestionText,
          targetQuestionId,
        }),
      })
      if (res.ok) {
        resetForm()
        setShowForm(false)
        router.refresh()
        const data = await res.json()
        setActions([data, ...actions])
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.saveFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.saveFailed)
    } finally {
      setLoading(false)
    }
  }

  // Edit existing action
  function startEdit(action: ImprovementAction) {
    setEditingId(action.id)
    setEditTitle(action.title)
    setEditDescription(action.description ?? "")
    setEditQuestionIds(parseQuestionIds(action.targetQuestionId))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle("")
    setEditDescription("")
    setEditQuestionIds(new Set())
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim() || loading) return
    setLoading(true)
    setErrorMsg(null)

    const qIds = Array.from(editQuestionIds)
    const targetQuestionId = qIds.length > 0 ? qIds.join(",") : null
    const targetQuestion = qIds.length > 0
      ? qIds.map((qId) => allQuestions.get(qId)?.text).filter(Boolean).join("、")
      : null

    try {
      const res = await fetch(`/api/improvement-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          targetQuestionId,
          targetQuestion,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setActions(actions.map((a) => (a.id === id ? updated : a)))
        cancelEdit()
        router.refresh()
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.editFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.editFailed)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: string, extra?: { completionReason?: string; completionNote?: string }) {
    setLoading(true)
    setErrorMsg(null)
    try {
      const body: Record<string, unknown> = { status, ...extra }
      const res = await fetch(`/api/improvement-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.refresh()
        const updated = await res.json()
        setActions(actions.map((a) => (a.id === id ? updated : a)))
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.statusChangeFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.statusChangeFailed)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(messages.improvementActions.deleteConfirm)) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/improvement-actions/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
        setActions(actions.filter((a) => a.id !== id))
        setExpandedId(null)
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.deleteFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.deleteFailed)
    } finally {
      setLoading(false)
    }
  }

  function handleLogUpdated(actionId: string, updatedLog: ActionLog) {
    setActions(actions.map((a) => {
      if (a.id !== actionId || !a.logs) return a
      return {
        ...a,
        logs: a.logs.map((l) => (l.id === updatedLog.id ? updatedLog : l)),
      }
    }))
  }

  const activeActions = actions.filter((a) => a.status === "active")
  const completedActions = actions.filter((a) => a.status !== "active")
  const doneActions = actions.filter((a) => a.status === "completed")
  const cancelledActions = actions.filter((a) => a.status === "cancelled")

  const hasTemplates = templateQuestions.length > 0

  // Summary statistics
  const summaryStats = useMemo(() => {
    const completedWithScores = doneActions.filter(
      (a) => a.baselineScore != null && a.resultScore != null
    )
    const avgImprovement =
      completedWithScores.length > 0
        ? completedWithScores.reduce(
            (sum, a) => sum + (a.resultScore! - a.baselineScore!),
            0
          ) / completedWithScores.length
        : null
    return {
      activeCount: activeActions.length,
      completedCount: doneActions.length,
      cancelledCount: cancelledActions.length,
      avgImprovement:
        avgImprovement != null ? Math.round(avgImprovement * 100) / 100 : null,
    }
  }, [activeActions.length, doneActions, cancelledActions.length])

  // Compute top 3 lowest-score questions (excluding those with active actions)
  const recommendedItems = useMemo(() => {
    const activeQuestionIds = new Set(
      actions
        .filter((a) => a.status === "active" && a.targetQuestionId)
        .flatMap((a) => a.targetQuestionId!.split(",").map((s) => s.trim()))
    )
    const scored: { questionId: string; text: string; templateName: string; score: number; category: string }[] = []
    for (const [qId, score] of Object.entries(questionScores)) {
      if (activeQuestionIds.has(qId)) continue
      const q = allQuestions.get(qId)
      if (!q) continue
      const category = QUESTION_CATEGORY_MAP[qId]
      if (!category) continue
      scored.push({ questionId: qId, text: q.text, templateName: q.templateName, score, category })
    }
    scored.sort((a, b) => a.score - b.score)
    return scored.slice(0, 3)
  }, [questionScores, actions, allQuestions])

  function handleRecommendedClick(questionId: string) {
    setShowForm(true)
    setSelectedQuestionIds(new Set([questionId]))
    setTitle("")
    setDescription("")
  }

  // Adopt a platform action
  async function handleAdopt(platformActionId: string, targetQuestionId?: string) {
    setAdoptingId(platformActionId)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/improvement-actions/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformActionId, targetQuestionId }),
      })
      if (res.ok) {
        const data = await res.json()
        setActions([data, ...actions])
        setAdoptedIds(new Set([...Array.from(adoptedIds), platformActionId]))
        setAdoptQuestionSelect(null)
        router.refresh()
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.saveFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.saveFailed)
    } finally {
      setAdoptingId(null)
    }
  }

  function handleAdoptClick(pa: PlatformActionData) {
    const questionIds = pa.targetQuestionIds ?? []
    if (questionIds.length > 1) {
      // Multiple target questions — show selection dialog
      setAdoptQuestionSelect({ platformActionId: pa.id, questionIds })
      setSelectedAdoptQuestionId(questionIds[0])
    } else {
      // 0 or 1 target question — adopt directly
      handleAdopt(pa.id, questionIds[0])
    }
  }

  // Pickup (isPickup) platform actions to show
  // ピックアップアクションを導入数の多い順にソート
  const pickupActions = platformActions
    .filter((pa) => pa.isPickup)
    .sort((a, b) => {
      const adoptA = platformActionOutcomes[a.id]?.adoptCount ?? 0
      const adoptB = platformActionOutcomes[b.id]?.adoptCount ?? 0
      return adoptB - adoptA
    })

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {actions.length > 0 && !showForm && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-blue-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{summaryStats.activeCount}</p>
            <p className="text-[11px] text-blue-600/70">{messages.improvementActions.summaryActive}</p>
          </div>
          <div className="rounded-lg border bg-green-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{summaryStats.completedCount}</p>
            <p className="text-[11px] text-green-600/70">{messages.improvementActions.summaryCompleted}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            {summaryStats.avgImprovement != null ? (
              <>
                <p className={`text-2xl font-bold ${summaryStats.avgImprovement >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {summaryStats.avgImprovement > 0 ? "+" : ""}{summaryStats.avgImprovement}
                </p>
                <p className="text-[11px] text-muted-foreground">{messages.improvementActions.summaryAvgImprovement}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-muted-foreground/50">—</p>
                <p className="text-[11px] text-muted-foreground/50">{messages.improvementActions.summaryNoCompletedYet}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pickup platform actions */}
      {!showForm && pickupActions.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/40 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-800">
              <Megaphone className="h-4 w-4" />
              {messages.platformActions.pickup}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {messages.platformActions.pickupDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pickupActions.map((pa) => {
              const isAdopted = adoptedIds.has(pa.id)
              const isAdopting = adoptingId === pa.id
              const categoryLabel = pa.category ? CATEGORY_LABELS[pa.category] : null
              const targetQIds = pa.targetQuestionIds ?? []
              return (
                <div
                  key={pa.id}
                  className="rounded-lg border border-purple-100 bg-white p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{pa.title}</p>
                        {categoryLabel && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {categoryLabel}
                          </span>
                        )}
                        {(() => {
                          const oc = platformActionOutcomes[pa.id]
                          if (!oc || oc.adoptCount === 0) return null
                          return (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              <Users className="h-2.5 w-2.5" />
                              {oc.adoptCount}{messages.platformActions.outcomeAdoptBadge}
                            </span>
                          )
                        })()}
                        {pa.serviceProvider && (
                          <span className="text-[10px] text-muted-foreground">
                            {messages.platformActions.provider}: {pa.serviceProvider}
                          </span>
                        )}
                      </div>
                      {pa.description && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {pa.description}
                        </p>
                      )}
                      {/* Target question scores */}
                      {targetQIds.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {targetQIds.map((qId) => {
                            const q = allQuestions.get(qId)
                            const score = questionScores[qId]
                            if (!q) return null
                            return (
                              <span key={qId} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                {q.text}
                                {score != null && (
                                  <span className="font-semibold text-amber-700">{score}</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Cross-clinic outcomes */}
                  {(() => {
                    const outcome = platformActionOutcomes[pa.id]
                    if (!outcome) return null
                    if (outcome.confidence === "insufficient") {
                      // データ不足：収集中メッセージを表示
                      if (outcome.adoptCount === 0) return null // 導入ゼロなら非表示
                      const remaining = MIN_CLINICS_FOR_DISPLAY - outcome.qualifiedCount
                      return (
                        <div className="rounded-md border border-dashed border-purple-200 bg-purple-50/30 px-3 py-2">
                          <p className="text-[11px] text-purple-600 flex items-center gap-1.5">
                            <BarChart3 className="h-3 w-3 text-purple-400" />
                            <span className="font-medium">{messages.platformActions.outcomeCollecting}</span>
                          </p>
                          <p className="mt-1 text-[10px] text-purple-400">
                            {messages.platformActions.outcomeCollectingDetail(remaining, outcome.qualifiedCount)}
                          </p>
                          {outcome.adoptCount > 0 && (
                            <p className="mt-0.5 text-[10px] text-purple-400">
                              {messages.platformActions.outcomeAdoptCount(outcome.adoptCount)}
                            </p>
                          )}
                        </div>
                      )
                    }
                    return (
                      <div className={`rounded-md px-3 py-2 space-y-1.5 ${isDemo ? "bg-purple-50/40 border border-dashed border-purple-200" : "bg-purple-50/60 border border-purple-100"}`}>
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
                  <div className="flex items-center gap-2">
                    {isAdopted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        {messages.platformActions.adopted}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAdoptClick(pa)}
                        disabled={isAdopting}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isAdopting ? (
                          messages.common.loading
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            {messages.platformActions.adopt}
                          </>
                        )}
                      </Button>
                    )}
                    {pa.serviceUrl && (
                      <a
                        href={pa.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {messages.platformActions.learnMore}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Question selection dialog for adopt */}
      {adoptQuestionSelect && (
        <Card className="border-purple-300 bg-purple-50/50">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">{messages.platformActions.selectTargetQuestion}</p>
            <select
              value={selectedAdoptQuestionId}
              onChange={(e) => setSelectedAdoptQuestionId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {adoptQuestionSelect.questionIds.map((qId) => {
                const q = allQuestions.get(qId)
                return (
                  <option key={qId} value={qId}>
                    {q ? q.text : qId}
                  </option>
                )
              })}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAdopt(adoptQuestionSelect.platformActionId, selectedAdoptQuestionId)}
                disabled={adoptingId !== null}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {adoptingId ? messages.common.loading : messages.platformActions.adopt}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdoptQuestionSelect(null)}
              >
                {messages.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add action button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {messages.improvementActions.addAction}
        </Button>
      )}

      {/* Recommended improvements */}
      {!showForm && recommendedItems.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/40 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {messages.improvementActions.recommendedTitle}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {messages.improvementActions.recommendedDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendedItems.map((item) => (
              <button
                key={item.questionId}
                type="button"
                onClick={() => handleRecommendedClick(item.questionId)}
                className="flex w-full items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2.5 text-left transition-all hover:border-amber-300 hover:bg-amber-50/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.templateName} ・ {CATEGORY_LABELS[item.category] ?? item.category}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-lg font-bold text-amber-700">{item.score}</p>
                  <p className="text-[10px] text-muted-foreground">{messages.improvementActions.recommendedScore}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rotating tips */}
      {!showForm && <RotatingTip />}

      {/* Error message */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">{messages.improvementActions.addAction}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Question selector (dropdown) — system_admin only */}
            {isSystemAdmin && hasTemplates && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {messages.improvementActions.selectQuestion}
                </Label>
                <QuestionSelect
                  templateQuestions={templateQuestions}
                  selectedId={Array.from(selectedQuestionIds)[0] ?? ""}
                  questionScores={questionScores}
                  onSelect={handleSelectQuestion}
                />
              </div>
            )}

            {/* Step 2: Suggestion cards (shown when question is selected) — system_admin only */}
            {isSystemAdmin && selectedQuestionIds.size > 0 && suggestions.length > 0 && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    <Lightbulb className="mr-1 inline h-3.5 w-3.5" />
                    {messages.improvementActions.suggestedActions}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {messages.improvementActions.suggestedActionsDesc}
                  </p>
                </div>
                <div className="grid gap-2">
                  {suggestions.map((s, i) => {
                    const isSelected = title === s.title && description === s.description
                    const outcome = suggestionOutcomeMap.get(s.title)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                        }`}
                      >
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                        {/* Inline outcome from other clinics */}
                        {outcome && outcome.confidence !== "insufficient" && (
                          <div className={`mt-2 flex items-center gap-3 rounded-md px-2.5 py-1.5 flex-wrap ${isDemo ? "bg-purple-50/50 border border-dashed border-purple-200" : "bg-purple-50/70"}`}>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-purple-700">
                              <Users className="h-3 w-3" />
                              {outcome.qualifiedCount}{messages.platformActions.outcomeClinics}
                            </span>
                            {outcome.avgScoreImprovement != null && (
                              <span className={`text-[11px] font-bold ${outcome.avgScoreImprovement > 0 ? "text-green-600" : outcome.avgScoreImprovement < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {messages.platformActions.outcomeScore} {outcome.avgScoreImprovement > 0 ? "+" : ""}{outcome.avgScoreImprovement}
                              </span>
                            )}
                            {outcome.avgDurationDays != null && (
                              <span className="text-[11px] text-purple-600">
                                {messages.platformActions.outcomeDuration}{" "}
                                <span className="font-bold text-slate-600">
                                  {outcome.avgDurationDays < 60
                                    ? `${outcome.avgDurationDays}${messages.platformActions.outcomeDaysUnit}`
                                    : `${(outcome.avgDurationDays / 30).toFixed(1)}${messages.platformActions.outcomeMonthsUnit}`
                                  }
                                </span>
                              </span>
                            )}
                            {outcome.confidence === "high" ? (
                              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                                {messages.platformActions.confidenceHigh}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                                {messages.platformActions.confidenceModerate}
                              </span>
                            )}
                            {isDemo && (
                              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-600">
                                {messages.platformActions.outcomeSampleBadge}
                              </span>
                            )}
                          </div>
                        )}
                        {outcome && outcome.confidence === "insufficient" && outcome.adoptCount > 0 && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-500">
                            <Users className="h-3 w-3" />
                            {messages.platformActions.outcomeAdoptCount(outcome.adoptCount)}
                          </p>
                        )}
                        {!outcome && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                            <BarChart3 className="h-3 w-3" />
                            {messages.platformActions.suggestionOutcomeCollecting}
                          </p>
                        )}
                      </button>
                    )
                  })}
                  {/* Custom action option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTitle("")
                      setDescription("")
                    }}
                    className={`rounded-lg border border-dashed p-3 text-left transition-all ${
                      title && !suggestions.some((s) => s.title === title)
                        ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                        : "border-gray-300 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      <Pencil className="mr-1 inline h-3.5 w-3.5" />
                      {messages.improvementActions.customAction}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {messages.improvementActions.customActionDesc}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Title & description (always shown, pre-filled from suggestion or manual) */}
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.actionTitle}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={messages.improvementActions.actionTitlePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.description}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={messages.improvementActions.descriptionPlaceholder}
              />
            </div>

            {/* Current scores of selected questions (auto-populated, last 30 days) — system_admin only */}
            {isSystemAdmin && selectedQuestionIds.size > 0 && (
              <SelectedQuestionsScores
                selectedIds={selectedQuestionIds}
                questionScores={questionScores}
                allQuestions={allQuestions}
              />
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={!title.trim() || loading}>
                {loading ? messages.common.loading : messages.common.save}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                {messages.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {actions.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {messages.improvementActions.noActions}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {messages.improvementActions.noActionsDesc}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active actions */}
      {activeActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {messages.improvementActions.statusActive}
          </h2>
          {activeActions.map((action) => {
            const qIds = parseQuestionIds(action.targetQuestionId)
            const questionLabels = Array.from(qIds)
              .map((qId) => {
                const q = allQuestions.get(qId)
                return q ? `${q.text}（${q.templateName}）` : null
              })
              .filter(Boolean)
            const questionLabel = questionLabels.length > 0 ? questionLabels.join("、") : action.targetQuestion
            const categories = Array.from(qIds)
              .map((qId) => QUESTION_CATEGORY_MAP[qId])
              .filter(Boolean)
            const category = categories[0]
            // Average score across selected questions
            const qScores = Array.from(qIds)
              .map((qId) => questionScores[qId])
              .filter((s): s is number => s != null)
            const avgCurrentScore = qScores.length > 0
              ? Math.round(qScores.reduce((a, b) => a + b, 0) / qScores.length * 100) / 100
              : undefined
            return (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedId === action.id}
                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onLogUpdated={handleLogUpdated}
                onLogAdded={(actionId, newLog) => {
                  setActions(actions.map((a) => {
                    if (a.id !== actionId) return a
                    return { ...a, logs: [...(a.logs ?? []), newLog] }
                  }))
                }}
                loading={loading}
                currentQuestionScore={avgCurrentScore}
                questionLabel={questionLabel}
                category={category}
                isEditing={editingId === action.id}
                onStartEdit={() => startEdit(action)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(action.id)}
                editTitle={editTitle}
                editDescription={editDescription}
                editQuestionIds={editQuestionIds}
                onEditTitleChange={setEditTitle}
                onEditDescriptionChange={setEditDescription}
                onEditSelectQuestion={(qId) => {
                  setEditQuestionIds(qId ? new Set([qId]) : new Set())
                }}
                templateQuestions={templateQuestions}
                questionScores={questionScores}
                allQuestions={allQuestions}
                isSystemAdmin={isSystemAdmin}
                monthlyMetrics={monthlyMetrics}
                seasonalIndices={seasonalIndices}
                platformActionOutcomes={platformActionOutcomes}
                isDemo={isDemo}
                isOwner={isOwner}
              />
            )
          })}
        </div>
      )}

      {/* Completed / cancelled actions */}
      {completedActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {messages.improvementActions.statusCompleted}
          </h2>
          {completedActions.map((action) => {
            const qIds = parseQuestionIds(action.targetQuestionId)
            const questionLabels = Array.from(qIds)
              .map((qId) => {
                const q = allQuestions.get(qId)
                return q ? `${q.text}（${q.templateName}）` : null
              })
              .filter(Boolean)
            const questionLabel = questionLabels.length > 0 ? questionLabels.join("、") : action.targetQuestion
            const categories = Array.from(qIds)
              .map((qId) => QUESTION_CATEGORY_MAP[qId])
              .filter(Boolean)
            const category = categories[0]
            return (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedId === action.id}
                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onLogUpdated={handleLogUpdated}
                onLogAdded={() => {}}
                loading={loading}
                questionLabel={questionLabel}
                category={category}
                isEditing={editingId === action.id}
                onStartEdit={() => startEdit(action)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(action.id)}
                editTitle={editTitle}
                editDescription={editDescription}
                editQuestionIds={editQuestionIds}
                onEditTitleChange={setEditTitle}
                onEditDescriptionChange={setEditDescription}
                onEditSelectQuestion={(qId) => {
                  setEditQuestionIds(qId ? new Set([qId]) : new Set())
                }}
                templateQuestions={templateQuestions}
                questionScores={questionScores}
                allQuestions={allQuestions}
                isSystemAdmin={isSystemAdmin}
                monthlyMetrics={monthlyMetrics}
                seasonalIndices={seasonalIndices}
                platformActionOutcomes={platformActionOutcomes}
                isDemo={isDemo}
                isOwner={isOwner}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
