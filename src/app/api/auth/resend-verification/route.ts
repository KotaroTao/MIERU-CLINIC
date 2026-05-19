import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { logger } from "@/lib/logger"
import {
  sendMail,
  generateVerificationToken,
  buildVerificationEmail,
  getEmailTemplates,
  type SendMailReason,
} from "@/lib/email"
import { messages } from "@/lib/messages"

/** 失敗理由から HTTP ステータスを決定 */
function statusForReason(reason: SendMailReason): number {
  switch (reason) {
    case "rate_limited_provider":
      return 429
    case "validation_error":
      return 422
    case "config_missing_host":
    case "config_missing_key":
    case "auth_failed":
    case "domain_unverified":
      return 503 // サービス側の設定不備 — クライアントが再試行しても解消しない
    case "api_error":
    case "network_error":
    case "unknown":
    default:
      return 502 // 上流（Resend）由来の一時的失敗
  }
}

/** 失敗理由からユーザー向けメッセージを決定 */
function userMessageForReason(reason: SendMailReason): string {
  switch (reason) {
    case "config_missing_host":
    case "config_missing_key":
      return messages.auth.verifyEmailResendFailedConfig
    case "auth_failed":
      return messages.auth.verifyEmailResendFailedAuth
    case "domain_unverified":
      return messages.auth.verifyEmailResendFailedDomain
    case "validation_error":
      return messages.auth.verifyEmailResendFailedInvalidAddress
    case "rate_limited_provider":
      return messages.auth.verifyEmailResendFailedProvider
    case "network_error":
      return messages.auth.verifyEmailResendFailedNetwork
    case "api_error":
    case "unknown":
    default:
      return messages.auth.verifyEmailResendFailed
  }
}

export async function POST(_request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const userId = authResult.user.id

  // レート制限（再送は1時間に3回まで）
  const ip = getClientIp()
  const { allowed } = checkRateLimit(`resend-verify:${ip}`, "resendVerification")
  if (!allowed) {
    return errorResponse(messages.apiErrors.rateLimitResend, 429)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, name: true, clinicId: true, clinic: { select: { name: true } } },
  })

  if (!user) {
    return errorResponse(messages.errors.notFound, 404)
  }

  if (user.emailVerified) {
    return successResponse({ alreadyVerified: true })
  }

  // 新しいトークン生成・メール送信（送信成功後にDB保存）
  const token = generateVerificationToken()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  const verifyUrl = `${appUrl}/verify-email?token=${token}`
  const templates = await getEmailTemplates()
  const { subject, html } = buildVerificationEmail(verifyUrl, user.clinic?.name || user.name, templates.verification)
  const result = await sendMail({
    to: user.email,
    subject,
    html,
    type: "resend_verification",
    clinicId: user.clinicId,
    userId,
  })

  if (!result.ok) {
    // メール送信失敗時は既存トークンを維持（以前の認証リンクを無効化しない）
    logger.error("Resend verification email failed", {
      component: "resend-verification",
      userId,
      reason: result.reason,
      providerStatus: result.providerStatus,
      detail: result.detail,
    })
    const status = statusForReason(result.reason)
    const userMessage = userMessageForReason(result.reason)
    // 本番では詳細は隠す（情報漏洩防止）。開発時のみ detail を返す
    const details = process.env.NODE_ENV === "production"
      ? { reason: result.reason }
      : { reason: result.reason, detail: result.detail, providerStatus: result.providerStatus }
    return errorResponse(userMessage, status, details)
  }

  // メール送信成功後にトークンを更新
  await prisma.user.update({
    where: { id: userId },
    data: { verificationToken: token },
  })

  return successResponse({ sent: true })
}
