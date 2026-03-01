import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createStaffSchema } from "@/lib/validations/staff"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.common.error, 400)
  }

  try {
    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return errorResponse(firstError?.message || messages.common.error, 400)
    }

    const { name, role, email, password, userRole } = parsed.data

    // メールアドレスの重複チェック
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (existingUser) {
        return errorResponse("このメールアドレスは既に使用されています", 400)
      }
    }

    // トランザクションで Staff + User を一括作成
    const result = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          clinicId,
          name,
          role,
        },
      })

      let user = null
      if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: userRole ?? "staff",
            clinicId,
            staffId: staff.id,
          },
        })
      }

      return { staff, user }
    })

    return successResponse({
      ...result.staff,
      hasLogin: !!result.user,
      userEmail: result.user?.email,
    }, 201)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
