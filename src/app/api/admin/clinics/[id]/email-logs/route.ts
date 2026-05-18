import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

const PAGE_SIZE = 50

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id: clinicId } = await params

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type") ?? "all"
  const status = searchParams.get("status") ?? "all"
  const period = searchParams.get("period") ?? "all"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const where: Prisma.EmailLogWhereInput = { clinicId }
  if (type !== "all") where.type = type
  if (status === "sent" || status === "failed") where.status = status
  if (period !== "all") {
    const days = parseInt(period, 10)
    if (Number.isFinite(days) && days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      where.sentAt = { gte: since }
    }
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        type: true,
        to: true,
        subject: true,
        status: true,
        errorMessage: true,
        sentAt: true,
      },
    }),
    prisma.emailLog.count({ where }),
  ])

  return successResponse({
    clinic: { id: clinic.id, name: clinic.name },
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}
