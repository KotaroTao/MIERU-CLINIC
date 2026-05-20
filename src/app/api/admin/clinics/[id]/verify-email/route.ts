import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true, ownerUserId: true },
  })

  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  if (!clinic.ownerUserId) {
    return errorResponse(messages.admin.noAdminUsers, 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: clinic.ownerUserId },
    select: { id: true, email: true, emailVerified: true },
  })

  if (!user) {
    return errorResponse(messages.errors.notFound, 404)
  }

  if (user.emailVerified) {
    return successResponse({ alreadyVerified: true })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  })

  logger.info("Email manually verified by system_admin", {
    component: "admin/verify-email",
    clinicId: id,
    userId: user.id,
    adminId: authResult.user.id,
  })

  return successResponse({ verified: true })
}
