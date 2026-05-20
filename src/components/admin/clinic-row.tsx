"use client"

import { useState } from "react"
import Link from "next/link"
import { LogIn, Loader2, Settings2, Sparkles, Crown, Mail, History, Trash2, ShieldCheck, ShieldAlert } from "lucide-react"
import { PlanSwitcher } from "@/components/admin/plan-switcher"
import { DemoSettingsDialog } from "@/components/admin/demo-settings-dialog"
import { OwnerSwitcher } from "@/components/admin/owner-switcher"
import { EmailSwitcher } from "@/components/admin/email-switcher"
import { DeleteClinicDialog } from "@/components/admin/delete-clinic-dialog"
import { ManualVerifyEmailDialog } from "@/components/admin/manual-verify-email-dialog"
import { PLANS } from "@/lib/constants"
import { messages } from "@/lib/messages"
import type { PlanTier } from "@/types"

const PLAN_BADGE_COLORS: Record<PlanTier, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  standard: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  demo: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
  special: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
}

interface ClinicRowProps {
  clinicId: string
  clinicName: string
  plan?: PlanTier
  ownerUserId?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  ownerEmailVerified?: boolean | null
  children: React.ReactNode
}

export function ClinicRow({ clinicId, clinicName, plan, ownerUserId, ownerName: initialOwnerName, ownerEmail: initialOwnerEmail, ownerEmailVerified, children }: ClinicRowProps) {
  const [loading, setLoading] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [demoDialogOpen, setDemoDialogOpen] = useState(false)
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [manualVerifyDialogOpen, setManualVerifyDialogOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanTier>(plan ?? "free")
  const [ownerName, setOwnerName] = useState(initialOwnerName ?? null)
  const [ownerEmail, setOwnerEmail] = useState(initialOwnerEmail ?? null)
  const [emailVerified, setEmailVerified] = useState(ownerEmailVerified)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/operator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (res.ok) {
        window.open("/dashboard", "_blank")
      }
    } finally {
      setLoading(false)
    }
  }

  function handlePlanClick(e: React.MouseEvent) {
    e.stopPropagation()
    setPlanDialogOpen(true)
  }

  function handleDemoClick(e: React.MouseEvent) {
    e.stopPropagation()
    setDemoDialogOpen(true)
  }

  function handleOwnerClick(e: React.MouseEvent) {
    e.stopPropagation()
    setOwnerDialogOpen(true)
  }

  function handleEmailClick(e: React.MouseEvent) {
    e.stopPropagation()
    setEmailDialogOpen(true)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteDialogOpen(true)
  }

  function handleManualVerifyClick(e: React.MouseEvent) {
    e.stopPropagation()
    setManualVerifyDialogOpen(true)
  }

  const planDef = PLANS[currentPlan]

  return (
    <>
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        className="group cursor-pointer rounded-lg border p-2.5 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
      >
        {children}
        {/* Plan badge + Owner badge + Demo settings + Login overlay */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlanClick}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80 ${PLAN_BADGE_COLORS[currentPlan]}`}
            >
              <Settings2 className="h-2.5 w-2.5" />
              {planDef.name}
            </button>
            <button
              type="button"
              onClick={handleOwnerClick}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              <Crown className="h-2.5 w-2.5" />
              {ownerName ?? "未設定"}
            </button>
            <button
              type="button"
              onClick={handleEmailClick}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-medium text-sky-700 transition-colors hover:bg-sky-100"
            >
              <Mail className="h-2.5 w-2.5" />
              {ownerEmail ?? messages.admin.emailNotSet}
            </button>
            {emailVerified === true && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700"
                title={messages.admin.emailVerified}
              >
                <ShieldCheck className="h-2.5 w-2.5" />
                {messages.admin.emailVerified}
              </span>
            )}
            {emailVerified === false && (
              <button
                type="button"
                onClick={handleManualVerifyClick}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700 transition-colors hover:bg-rose-100"
                title={messages.admin.manualVerifyEmail}
              >
                <ShieldAlert className="h-2.5 w-2.5" />
                {messages.admin.emailUnverified}
              </button>
            )}
            {currentPlan === "demo" && (
              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-0.5 text-[10px] font-medium text-pink-600 transition-colors hover:bg-pink-100"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {messages.demoSettings.openSettings}
              </button>
            )}
            <Link
              href={`/admin/clinics/${clinicId}/email-logs`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <History className="h-2.5 w-2.5" />
              {messages.emailLogs.rowButton}
            </Link>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-100"
              title={messages.admin.deleteClinic}
            >
              <Trash2 className="h-2.5 w-2.5" />
              {messages.common.delete}
            </button>
          </div>
          <div className="hidden opacity-0 transition-opacity group-hover:opacity-100 sm:block">
            {loading ? (
              <span className="flex items-center gap-1 text-[11px] text-violet-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                ログイン中...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-violet-500 whitespace-nowrap">
                <LogIn className="h-3 w-3" />
                クリックでダッシュボード
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan switcher dialog */}
      {planDialogOpen && (
        <PlanSwitcher
          clinicId={clinicId}
          clinicName={clinicName}
          currentPlan={currentPlan}
          onClose={() => setPlanDialogOpen(false)}
          onUpdated={(newPlan) => setCurrentPlan(newPlan)}
        />
      )}

      {/* Owner switcher dialog */}
      {ownerDialogOpen && (
        <OwnerSwitcher
          clinicId={clinicId}
          clinicName={clinicName}
          onClose={() => setOwnerDialogOpen(false)}
          onUpdated={(name) => setOwnerName(name)}
        />
      )}

      {/* Email switcher dialog */}
      {emailDialogOpen && (
        <EmailSwitcher
          clinicId={clinicId}
          clinicName={clinicName}
          ownerUserId={ownerUserId}
          onClose={() => setEmailDialogOpen(false)}
          onUpdated={(email) => setOwnerEmail(email)}
        />
      )}

      {/* Demo settings dialog */}
      {demoDialogOpen && (
        <DemoSettingsDialog
          clinicId={clinicId}
          clinicName={clinicName}
          onClose={() => setDemoDialogOpen(false)}
        />
      )}

      {/* Delete clinic dialog */}
      {deleteDialogOpen && (
        <DeleteClinicDialog
          clinicId={clinicId}
          clinicName={clinicName}
          onClose={() => setDeleteDialogOpen(false)}
        />
      )}

      {/* Manual email verification dialog */}
      {manualVerifyDialogOpen && (
        <ManualVerifyEmailDialog
          clinicId={clinicId}
          clinicName={clinicName}
          ownerEmail={ownerEmail}
          onClose={() => setManualVerifyDialogOpen(false)}
          onVerified={() => setEmailVerified(true)}
        />
      )}
    </>
  )
}
