import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const origin = req.nextUrl.origin

  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`)
  }

  const provider = req.nextUrl.searchParams.get("provider") || "google"
  const next = req.nextUrl.searchParams.get("next") || "/dashboard"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google",
    options: {
      redirectTo: `${origin}/api/auth/supabase/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    console.error("[supabase-oauth-start]", error)
    return NextResponse.redirect(`${origin}/login?error=oauth_start_failed`)
  }

  return NextResponse.redirect(data.url)
}
