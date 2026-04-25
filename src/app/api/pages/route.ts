import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { encryptToken } from "@/lib/crypto"

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
  if (!workspaceId) return NextResponse.json({ pages: [] })

  const pages = await prisma.page.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { triggers: true, conversations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Never expose encrypted token to client
  const safePagesMap = pages.map((p) => ({
    id: p.id,
    facebookPageId: p.facebookPageId,
    pageName: p.pageName,
    pageAvatarUrl: p.pageAvatarUrl,
    status: p.status,
    permissionsStatus: p.permissionsStatus,
    createdAt: p.createdAt,
    _count: p._count,
  }))

  return NextResponse.json({ pages: safePagesMap })
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { pageName, facebookPageId, pageAccessToken } = await req.json()

  // Encrypt the token before storing
  const tokenToEncrypt = pageAccessToken || "mock_token_replace_with_real"
  const pageAccessTokenEncrypted = encryptToken(tokenToEncrypt)

  const page = await prisma.page.create({
    data: {
      pageName,
      facebookPageId: facebookPageId || `mock_${Date.now()}`,
      pageAccessTokenEncrypted,
      workspaceId,
      status: "active",
      permissionsStatus: "ok",
    },
  })

  return NextResponse.json({ page: { ...page, pageAccessTokenEncrypted: undefined } })
}

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, status, permissionsStatus } = await req.json()
  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const page = await prisma.page.update({
    where: { id, workspaceId },
    data: {
      ...(status && { status }),
      ...(permissionsStatus && { permissionsStatus }),
    },
  })

  return NextResponse.json({ page })
}

export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const workspaceId = await getWorkspaceId(currentUser.id)
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  await prisma.page.delete({ where: { id, workspaceId } })

  return NextResponse.json({ success: true })
}
