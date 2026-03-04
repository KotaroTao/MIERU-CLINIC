import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { getTokenTimestamp } from "@/lib/email"
import { messages } from "@/lib/messages"
import { resetPasswordSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"

const ONE_HOUR = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { token, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token },
  })

  if (!user) {
    return errorResponse(messages.auth.resetPasswordInvalid, 400)
  }

  // トークンに埋め込まれたタイムスタンプで1時間以内かチェック
  const issuedAt = getTokenTimestamp(token) ?? new Date(user.updatedAt).getTime()
  const tokenAge = Date.now() - issuedAt
  if (tokenAge > ONE_HOUR) {
    return errorResponse(messages.auth.resetPasswordExpired, 400)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
    },
  })

  return successResponse({ reset: true })
}
