"use client"

import { messages } from "@/lib/messages"
import type { TemplateData } from "@/types"
import type { SeasonalIndices } from "@/lib/queries/seasonal-index"
import type { PlatformActionOutcome } from "@/lib/queries/platform-action-stats"
import {
  Play,
  CheckCircle2,
  Ban,
  RefreshCw,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"

// ─── Shared types ───

export interface ActionLog {
  id: string
  action: string // started, completed, cancelled, reactivated
  satisfactionScore: number | null
  note: string | null
  createdAt: string | Date
}

export interface ImprovementAction {
  id: string
  title: string
  description: string | null
  targetQuestion: string | null
  targetQuestionId: string | null
  baselineScore: number | null
  resultScore: number | null
  completionReason: string | null
  completionNote: string | null
  status: string
  platformActionId?: string | null
  startedAt: string | Date
  completedAt: string | Date | null
  logs?: ActionLog[]
}

export interface PlatformActionData {
  id: string
  title: string
  description: string | null
  detailedContent: string | null
  targetQuestionIds: string[] | null
  category: string | null
  isPickup: boolean
  serviceUrl: string | null
  serviceProvider: string | null
}

export interface MonthlyMetric {
  year: number
  month: number
  totalPatientCount: number | null
  totalRevenue: number | null
  cancellationCount: number | null
  totalVisitCount: number | null
}

// ─── Helpers ───

export function parseQuestionIds(targetQuestionId: string | null): Set<string> {
  if (!targetQuestionId) return new Set()
  return new Set(targetQuestionId.split(",").map((s) => s.trim()).filter(Boolean))
}

// ─── LOG_ACTION_CONFIG ───

export const LOG_ACTION_CONFIG: Record<string, {
  label: string
  icon: typeof Play
  color: string
  dotColor: string
}> = {
  started: {
    label: messages.improvementActions.logStarted,
    icon: Play,
    color: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: messages.improvementActions.logCompleted,
    icon: CheckCircle2,
    color: "text-green-600",
    dotColor: "bg-green-500",
  },
  cancelled: {
    label: messages.improvementActions.logCancelled,
    icon: Ban,
    color: "text-gray-500",
    dotColor: "bg-gray-400",
  },
  reactivated: {
    label: messages.improvementActions.logReactivated,
    icon: RefreshCw,
    color: "text-amber-600",
    dotColor: "bg-amber-500",
  },
  note: {
    label: messages.improvementActions.addLog,
    icon: StickyNote,
    color: "text-purple-600",
    dotColor: "bg-purple-400",
  },
}

// ─── QuestionSelect ───

export function QuestionSelect({
  templateQuestions,
  selectedId,
  questionScores,
  onSelect,
}: {
  templateQuestions: TemplateData[]
  selectedId: string
  questionScores: Record<string, number>
  onSelect: (questionId: string) => void
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <option value="">{messages.improvementActions.selectQuestionPlaceholder}</option>
      {templateQuestions.map((t) => (
        <optgroup key={t.name} label={t.name}>
          {t.questions.map((q) => {
            const score = questionScores[q.id]
            return (
              <option key={q.id} value={q.id}>
                {q.text}{score != null ? ` (${score})` : ""}
              </option>
            )
          })}
        </optgroup>
      ))}
    </select>
  )
}

// ─── SelectedQuestionsScores ───

export function SelectedQuestionsScores({
  selectedIds,
  questionScores,
  allQuestions,
}: {
  selectedIds: Set<string>
  questionScores: Record<string, number>
  allQuestions: Map<string, { text: string; templateName: string }>
}) {
  const qIds = Array.from(selectedIds)
  const scored = qIds
    .map((qId) => ({ qId, text: allQuestions.get(qId)?.text, score: questionScores[qId] }))
    .filter((x): x is { qId: string; text: string; score: number } => x.text != null && x.score != null)

  if (scored.length === 0) return null

  const avg = Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length * 100) / 100

  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1">
      <p className="text-xs text-muted-foreground">
        {messages.improvementActions.baselineScore}
        <span className="ml-1 text-[10px] text-muted-foreground/70">
          （{messages.improvementActions.baselineScoreNote}）
        </span>
      </p>
      {scored.length === 1 ? (
        <p className="text-lg font-bold">{scored[0].score}</p>
      ) : (
        <>
          <div className="space-y-0.5">
            {scored.map((s) => (
              <div key={s.qId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{s.text}</span>
                <span className="font-semibold tabular-nums">{s.score}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">平均</span>
            <span className="text-lg font-bold">{avg}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── RotatingTip ───

export function RotatingTip() {
  const tips = messages.improvementActions.tips
  const [index, setIndex] = useState(0)

  function goPrev() {
    setIndex((i) => (i - 1 + tips.length) % tips.length)
  }

  function goNext() {
    setIndex((i) => (i + 1) % tips.length)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-amber-50/50 px-4 py-3">
      <button onClick={goPrev} className="shrink-0 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <p className="flex-1 text-center text-xs text-muted-foreground leading-relaxed">
        💡 {tips[index]}
      </p>
      <button onClick={goNext} className="shrink-0 text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Shared prop types for ActionCard ───

export interface ActionCardProps {
  action: ImprovementAction
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string, extra?: { completionReason?: string; completionNote?: string }) => void
  onDelete: (id: string) => void
  onLogUpdated: (actionId: string, updatedLog: ActionLog) => void
  onLogAdded: (actionId: string, newLog: ActionLog) => void
  loading: boolean
  currentQuestionScore?: number
  questionLabel?: string | null
  category?: string
  isEditing?: boolean
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
  editTitle?: string
  editDescription?: string
  editQuestionIds?: Set<string>
  onEditTitleChange?: (v: string) => void
  onEditDescriptionChange?: (v: string) => void
  onEditSelectQuestion?: (qId: string) => void
  templateQuestions?: TemplateData[]
  questionScores?: Record<string, number>
  allQuestions?: Map<string, { text: string; templateName: string }>
  isSystemAdmin?: boolean
  monthlyMetrics?: MonthlyMetric[]
  seasonalIndices?: SeasonalIndices
  platformActionOutcomes?: Record<string, PlatformActionOutcome>
  isDemo?: boolean
  isOwner?: boolean
}
