// api/triggers/route.ts — v2: full CRUD with multi-step support

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"

async function getWorkspaceId(userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: userId },
  })
  return workspace?.id
}

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ triggers: [] })

  const triggers = await prisma.trigger.findMany({
    where: { workspaceId },
    include: {
      page: true,
      steps: { orderBy: { stepOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ triggers })
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { triggerName, keyword, keywordMatchType, cooldownMinutes, pageId, steps } = await req.json()

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "At least one DM step is required" }, { status: 400 })
  }

  const trigger = await prisma.trigger.create({
    data: {
      triggerName,
      keyword,
      keywordMatchType: keywordMatchType || "contains",
      cooldownMinutes: cooldownMinutes ?? 1440,
      workspaceId,
      pageId,
      isActive: true,
      steps: {
        create: steps.map((s: { message: string; delaySeconds?: number }, i: number) => ({
          stepOrder: i + 1,
          message: s.message,
          delaySeconds: s.delaySeconds ?? 0,
        })),
      },
    },
    include: {
      page: true,
      steps: { orderBy: { stepOrder: "asc" } },
    },
  })

  return NextResponse.json({ trigger })
}

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, isActive, triggerName, keyword, keywordMatchType, cooldownMinutes, steps } = await req.json()
  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  // Update trigger metadata
  await prisma.trigger.update({
    where: { id, workspaceId },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(triggerName && { triggerName }),
      ...(keyword && { keyword }),
      ...(keywordMatchType && { keywordMatchType }),
      ...(cooldownMinutes !== undefined && { cooldownMinutes }),
    },
  })

  // Replace steps if provided
  if (steps && Array.isArray(steps)) {
    await prisma.triggerStep.deleteMany({ where: { triggerId: id } })
    await prisma.triggerStep.createMany({
      data: steps.map((s: { message: string; delaySeconds?: number }, i: number) => ({
        triggerId: id,
        stepOrder: i + 1,
        message: s.message,
        delaySeconds: s.delaySeconds ?? 0,
      })),
    })
  }

  const trigger = await prisma.trigger.findUnique({
    where: { id },
    include: {
      page: true,
      steps: { orderBy: { stepOrder: "asc" } },
    },
  })

  return NextResponse.json({ trigger })
}

export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  await prisma.trigger.delete({ where: { id, workspaceId } })

  return NextResponse.json({ success: true })
}
