import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { processCommentEvent } from "@/lib/trigger-engine"
import { prisma } from "@/lib/prisma"

/**
 * Test endpoint: simulate a comment event without needing a real Facebook webhook.
 * POST body: { pageId, commentText, commenterId? }
 */
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pageId, commentText, commenterId } = await req.json()

  if (!pageId || !commentText) {
    return NextResponse.json(
      { error: "pageId and commentText are required" },
      { status: 400 }
    )
  }

  // Verify the page belongs to the user's workspace
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: currentUser.id },
  })

  const page = await prisma.page.findFirst({
    where: { id: pageId, workspaceId: workspace?.id },
  })

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  const result = await processCommentEvent({
    facebookPageId: page.facebookPageId,
    userPsid: commenterId ?? `test_user_${Date.now()}`,
    commentText,
    commentId: `test_comment_${Date.now()}`,
  })

  return NextResponse.json({ result })
}
