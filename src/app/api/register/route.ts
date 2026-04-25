import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserWorkspace } from "@/lib/current-user"

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is missing in deployment environment variables" },
        { status: 500 }
      )
    }

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    await ensureUserWorkspace(user.id, name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[register]", error)
    const message = error instanceof Error ? error.message : "Unknown registration error"

    if (message.includes("Can't reach database server") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database connection failed. Check DATABASE_URL in Vercel." },
        { status: 500 }
      )
    }

    if (message.includes("does not exist") || message.includes("no such table")) {
      return NextResponse.json(
        { error: "Database tables are missing. Run Prisma migration or db push on Supabase." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Registration failed. Check Vercel Function logs for details." },
      { status: 500 }
    )
  }
}
