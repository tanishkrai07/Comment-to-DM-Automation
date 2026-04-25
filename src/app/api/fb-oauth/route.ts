import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"

/**
 * Initiates the Facebook OAuth flow.
 * Redirects user to Facebook's login dialog.
 */
export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appId = process.env.META_APP_ID
  if (!appId || appId === "your_meta_app_id") {
    // Redirect back with error if no app ID configured
    return NextResponse.redirect(
      new URL(
        "/pages?error=no_meta_app",
        process.env.NEXTAUTH_URL ?? "http://localhost:3000"
      )
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/fb-oauth/callback`

  const scopes = [
    "pages_messaging",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_show_list",
  ].join(",")

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state: currentUser?.id ?? "unknown",
  })

  const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params}`

  return NextResponse.redirect(fbLoginUrl)
}
