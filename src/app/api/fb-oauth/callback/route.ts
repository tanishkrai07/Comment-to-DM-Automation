import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForToken, getUserPages, subscribePageToWebhook } from "@/lib/facebook"
import { encrypt } from "@/lib/crypto"

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

/**
 * Facebook OAuth callback.
 * Exchanges the code for a user token, gets all managed pages,
 * stores encrypted page tokens in DB.
 */
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) {
    return NextResponse.redirect(`${BASE_URL}/login`)
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDesc = searchParams.get("error_description")

  // User denied permissions
  if (error) {
    console.warn(`[FB OAuth] User denied: ${error} — ${errorDesc}`)
    return NextResponse.redirect(
      `${BASE_URL}/pages?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/pages?error=no_code`)
  }

  // Get the user's workspace
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: currentUser.id },
  })

  if (!workspace) {
    return NextResponse.redirect(`${BASE_URL}/pages?error=no_workspace`)
  }

  // Exchange code for user access token
  const redirectUri = `${BASE_URL}/api/fb-oauth/callback`
  const userToken = await exchangeCodeForToken(code, redirectUri)

  if (!userToken) {
    return NextResponse.redirect(`${BASE_URL}/pages?error=token_exchange_failed`)
  }

  // Get all pages managed by this user
  const fbPages = await getUserPages(userToken)

  if (fbPages.length === 0) {
    return NextResponse.redirect(`${BASE_URL}/pages?error=no_pages`)
  }

  let connectedCount = 0

  for (const fbPage of fbPages) {
    // Encrypt the page access token
    const encryptedToken = encrypt(fbPage.access_token)

    // Upsert the page in our DB
    await prisma.page.upsert({
      where: {
        // We need a unique constraint — using facebookPageId + workspaceId
        // For now, find existing or create
        id: (
          await prisma.page.findFirst({
            where: { facebookPageId: fbPage.id, workspaceId: workspace.id },
            select: { id: true },
          })
        )?.id ?? "new",
      },
      update: {
        pageName: fbPage.name,
        pageAccessTokenEncrypted: encryptedToken,
        status: "active",
        permissionsStatus: "ok",
      },
      create: {
        facebookPageId: fbPage.id,
        pageName: fbPage.name,
        pageAccessTokenEncrypted: encryptedToken,
        workspaceId: workspace.id,
        status: "active",
        permissionsStatus: "ok",
      },
    })

    // Subscribe this page to webhook updates
    await subscribePageToWebhook(fbPage.access_token)

    connectedCount++
  }

  console.log(`[FB OAuth] Connected ${connectedCount} page(s) for user ${currentUser.id}`)

  return NextResponse.redirect(
    `${BASE_URL}/pages?connected=${connectedCount}`
  )
}
