import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: currentUser.id },
    include: {
      pages: {
        include: {
          triggers: true,
          messageLogs: true,
          events: true,
        },
      },
      triggers: true,
    },
  })

  if (!workspace) {
    return NextResponse.json({
      pagesCount: 0,
      triggersCount: 0,
      dmsSentToday: 0,
      errorCount: 0,
      recentActivity: [],
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allPageIds = workspace.pages.map((p: { id: string }) => p.id)

  const dmsSentToday = await prisma.messageLog.count({
    where: {
      pageId: { in: allPageIds },
      createdAt: { gte: today },
    },
  })

  const errorCount = await prisma.event.count({
    where: {
      pageId: { in: allPageIds },
      processedStatus: "error",
    },
  })

  const recentEvents = await prisma.event.findMany({
    where: { pageId: { in: allPageIds } },
    include: { page: true, trigger: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({
    pagesCount: workspace.pages.length,
    triggersCount: workspace.triggers.length,
    dmsSentToday,
    errorCount,
    recentActivity: recentEvents,
  })
}
