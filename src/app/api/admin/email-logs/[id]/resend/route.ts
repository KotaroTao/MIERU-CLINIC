import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import { sendMail, type EmailType } from "@/lib/email"

const ALLOWED_TYPES: EmailType[] = [
  "verification",
  "resend_verification",
  "welcome",
  "reminder",
  "weekly_summary",
  "password_reset",
]

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const log = await prisma.emailLog.findUnique({
    where: { id },
    select: {
      clinicId: true,
      userId: true,
      type: true,
      to: true,
      subject: true,
      html: true,
    },
  })

  if (!log) {
    return errorResponse(messages.errors.notFound, 404)
  }

  const type = ALLOWED_TYPES.includes(log.type as EmailType)
    ? (log.type as EmailType)
    : "verification"

  const sent = await sendMail({
    to: log.to,
    subject: log.subject,
    html: log.html,
    type,
    clinicId: log.clinicId,
    userId: log.userId,
  })

  if (!sent) {
    return errorResponse(messages.emailLogs.resendFailed, 500)
  }

  return successResponse({ sent: true })
}
