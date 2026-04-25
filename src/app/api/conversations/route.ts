import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: currentUser.id },
  })
  if (!workspace) return NextResponse.json({ conversations: [] })

  const pages = await prisma.page.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true },
  })
  const pageIds = pages.map((p: { id: string }) => p.id)

  const conversations = await prisma.conversation.findMany({
    where: { pageId: { in: pageIds } },
    include: {
      page: { select: { pageName: true } },
      trigger: {
        select: {
          triggerName: true,
          keyword: true,
          steps: { select: { id: true }, orderBy: { stepOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json({ conversations })
}
