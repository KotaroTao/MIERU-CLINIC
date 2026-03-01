import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    logger.error("Health check failed", { component: "health", error: String(error) })
    return NextResponse.json({ status: "error" }, { status: 503 })
  }
}
