import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: currentUser.id },
    include: { pages: { select: { id: true, pageName: true } } },
  })

  if (!workspace) {
    return NextResponse.json({ totalDms: 0, successRate: 0, topTriggers: [], pageStats: [], eventsByStatus: {}, last7Days: [] })
  }

  const pageIds = workspace.pages.map((p: { id: string }) => p.id)

  // Total DMs
  const totalDms = await prisma.messageLog.count({ where: { pageId: { in: pageIds } } })

  // Events by status
  const events = await prisma.event.findMany({
    where: { pageId: { in: pageIds } },
    select: { processedStatus: true },
  })

  const eventsByStatus: Record<string, number> = {}
  for (const e of events) {
    eventsByStatus[e.processedStatus] = (eventsByStatus[e.processedStatus] ?? 0) + 1
  }

  const sentCount = eventsByStatus["sent"] ?? 0
  const totalProcessed = Object.values(eventsByStatus).reduce((a, b) => a + b, 0)
  const successRate = totalProcessed === 0 ? 0 : Math.round((sentCount / totalProcessed) * 100)

  // Top triggers by DM count
  const triggers = await prisma.trigger.findMany({
    where: { workspaceId: workspace.id },
    include: {
      events: { select: { id: true, processedStatus: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const topTriggers = await Promise.all(
    triggers.map(async (t) => {
      const sentCount = await prisma.messageLog.count({
        where: { conversation: { triggerId: t.id } },
      })
      return {
        triggerName: t.triggerName,
        keyword: t.keyword,
        sentCount,
        matchCount: t.events.filter((e) => e.processedStatus !== "no_match").length,
      }
    })
  )

  topTriggers.sort((a, b) => b.sentCount - a.sentCount)
  topTriggers.splice(10)


  // Per-page stats
  const pageStats = await Promise.all(
    workspace.pages.map(async (page: { id: string; pageName: string }) => {
      const dmsCount = await prisma.messageLog.count({ where: { pageId: page.id } })
      const errorCount = await prisma.event.count({
        where: { pageId: page.id, processedStatus: "error" },
      })
      return { pageName: page.pageName, dmsCount, errorCount }
    })
  )

  return NextResponse.json({ totalDms, successRate, topTriggers, pageStats, eventsByStatus, last7Days: [] })
}
