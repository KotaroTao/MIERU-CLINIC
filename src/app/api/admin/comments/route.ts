import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { DYNAMIC_MESSAGES, MESSAGE_CATEGORIES } from "@/lib/dynamic-messages"

const SETTING_KEY = "dashboardComments"

export type CommentItem = {
  category: string
  text: string
}

type CommentsSettingValue = {
  comments: CommentItem[]
}

export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const setting = await prisma.platformSetting.findUnique({
    where: { key: SETTING_KEY },
  })

  if (!setting) {
    // Return defaults from hardcoded messages
    const defaults = DYNAMIC_MESSAGES.map((msg) => ({
      category: getCategoryFromMessage(msg),
      text: msg.text,
    }))
    return successResponse({ comments: defaults, isCustom: false })
  }

  const value = setting.value as unknown as CommentsSettingValue
  return successResponse({
    comments: value.comments ?? [],
    isCustom: true,
  })
}

export async function PUT(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const { comments, resetToDefaults } = body

    // Reset to defaults: delete the platform setting
    if (resetToDefaults) {
      await prisma.platformSetting.deleteMany({
        where: { key: SETTING_KEY },
      })
      const defaults = DYNAMIC_MESSAGES.map((msg) => ({
        category: getCategoryFromMessage(msg),
        text: msg.text,
      }))
      return successResponse({ comments: defaults, isCustom: false })
    }

    if (!Array.isArray(comments)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const validCategories: string[] = MESSAGE_CATEGORIES.map((c) => c.key)

    const validatedComments: CommentItem[] = comments
      .filter(
        (c: Record<string, unknown>) =>
          c &&
          typeof c.category === "string" &&
          typeof c.text === "string" &&
          c.text.toString().trim() &&
          validCategories.includes(c.category as string)
      )
      .map((c: Record<string, string>) => ({
        category: c.category.trim(),
        text: c.text.trim().slice(0, 200),
      }))

    const value: CommentsSettingValue = {
      comments: validatedComments,
    }

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: value as unknown as Prisma.InputJsonValue },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
      },
    })

    return successResponse({ comments: validatedComments, isCustom: true })
  } catch {
    return errorResponse(messages.commentsManager.saveFailed, 500)
  }
}

/** Map a DynamicMessage to its category key based on its condition */
function getCategoryFromMessage(msg: (typeof DYNAMIC_MESSAGES)[number]): string {
  if (!msg.condition) return "generic"

  // Test against known contexts to determine category
  const priority = msg.priority ?? 0

  if (priority === 10) return "goalAchieved"
  if (priority === 8) return "almostGoal"
  if (priority === 5) return "todayZero"
  if (priority === 6) return "lowScore"

  // Check condition with specific contexts
  const streakCtx = { todayCount: 5, dailyGoal: 10, streak: 14, todayAvgScore: 4.0, totalCount: 100 }
  const highScoreCtx = { todayCount: 5, dailyGoal: 10, streak: 0, todayAvgScore: 4.8, totalCount: 100 }

  if (msg.condition(streakCtx, "daytime") && priority >= 2 && priority <= 4) {
    // Could be streak or highScore - disambiguate
    if (msg.condition(highScoreCtx, "daytime") && !msg.condition({ ...highScoreCtx, streak: 0 }, "daytime")) {
      return "streak"
    }
    if (msg.condition(highScoreCtx, "daytime")) return "highScore"
    return "streak"
  }

  // Time-based checks
  const neutralCtx = { todayCount: 5, dailyGoal: 10, streak: 0, todayAvgScore: 4.0, totalCount: 100 }
  if (msg.condition(neutralCtx, "morning") && !msg.condition(neutralCtx, "evening") && !msg.condition(neutralCtx, "daytime")) {
    return "morning"
  }
  if (msg.condition(neutralCtx, "evening") && !msg.condition(neutralCtx, "morning") && !msg.condition(neutralCtx, "daytime")) {
    return "evening"
  }

  return "generic"
}
