import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const log = await prisma.emailLog.findUnique({
    where: { id },
    select: {
      id: true,
      clinicId: true,
      userId: true,
      type: true,
      to: true,
      subject: true,
      html: true,
      status: true,
      errorMessage: true,
      providerMessageId: true,
      sentAt: true,
    },
  })

  if (!log) {
    return errorResponse(messages.errors.notFound, 404)
  }

  return successResponse({ log })
}
