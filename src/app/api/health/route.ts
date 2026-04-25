import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const requiredEnv = [
    "DATABASE_URL",
    "META_APP_ID",
    "META_APP_SECRET",
    "WEBHOOK_VERIFY_TOKEN",
    "ENCRYPTION_KEY",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]

  const missingEnv = requiredEnv.filter((key) => !process.env[key])

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        missingEnv,
        error: error instanceof Error ? error.message : "Database check failed",
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    ok: missingEnv.length === 0,
    database: "ok",
    missingEnv,
    checkedAt: new Date().toISOString(),
  })
}
