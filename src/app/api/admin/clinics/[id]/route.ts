import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: { confirmName?: string } = {}
  try {
    body = await request.json()
  } catch {
    // ボディなしでも許容（confirmNameは任意の二重確認）
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  if (body.confirmName !== undefined && body.confirmName !== clinic.name) {
    return errorResponse(messages.admin.deleteConfirmMismatch, 400)
  }

  await prisma.$transaction(async (tx) => {
    // クリニックに紐づくユーザー（管理者・スタッフ）を先に削除
    // Clinic.ownerUserId は SetNull、User.clinicId は SetNull なので削除可能
    await tx.user.deleteMany({
      where: { clinicId: id },
    })

    // クリニック削除（残りの関連レコードは onDelete: Cascade で連鎖削除）
    await tx.clinic.delete({
      where: { id },
    })
  })

  return successResponse({ id: clinic.id, name: clinic.name })
}
