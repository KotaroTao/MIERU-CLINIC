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
    // クリニックに関連する全ユーザーを収集（複数経路を網羅）
    //   1. User.clinicId が一致
    //   2. Clinic.ownerUserId（オーナー）
    //   3. User.staff.clinicId が一致（スタッフ）
    // ※ system_admin は role で除外（運営アカウントを誤って消さない）
    const relatedUsers = await tx.user.findMany({
      where: {
        role: { not: "system_admin" },
        OR: [
          { clinicId: id },
          { ownedClinic: { id } },
          { staff: { clinicId: id } },
        ],
      },
      select: { id: true },
    })
    const userIds = relatedUsers.map((u) => u.id)

    if (userIds.length > 0) {
      // ユーザー削除前に EmailLog の userId を NULL にする必要はない
      // （EmailLog.userId は onDelete: SetNull で自動処理）
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      })
    }

    // クリニック削除（残りの関連レコードは onDelete: Cascade で連鎖削除）
    await tx.clinic.delete({
      where: { id },
    })
  })

  return successResponse({ id: clinic.id, name: clinic.name })
}
