import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { ensureUserWorkspace } from "@/lib/current-user"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const origin = req.nextUrl.origin
  const code = req.nextUrl.searchParams.get("code")
  const next = req.nextUrl.searchParams.get("next") || "/dashboard"

  if (!supabase || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`)
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error("[supabase-oauth-exchange]", error)
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`)
  }

  const { data } = await supabase.auth.getUser()
  const supabaseUser = data.user
  const email = supabaseUser?.email

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=oauth_email_missing`)
  }

  const displayName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    email.split("@")[0]

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: displayName },
    create: {
      email,
      name: displayName,
      password: `supabase:${supabaseUser.id}`,
    },
  })

  await ensureUserWorkspace(user.id, user.name)

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/dashboard"}`)
}
