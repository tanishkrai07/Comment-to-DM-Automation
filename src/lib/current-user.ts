import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface CurrentUser {
  id: string
  name: string | null
  email: string
  authProvider: "nextauth" | "supabase"
}

export async function ensureUserWorkspace(userId: string, name?: string | null) {
  const existingWorkspace = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  })

  if (!existingWorkspace) {
    await prisma.workspace.create({
      data: {
        name: `${name || "My"} Workspace`,
        ownerId: userId,
      },
    })
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const nextAuthSession = await auth()

  if (nextAuthSession?.user?.id && nextAuthSession.user.email) {
    return {
      id: nextAuthSession.user.id,
      name: nextAuthSession.user.name ?? null,
      email: nextAuthSession.user.email,
      authProvider: "nextauth",
    }
  }

  const supabase = await createSupabaseServerClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.email) return null

  const displayName =
    data.user.user_metadata?.full_name ||
    data.user.user_metadata?.name ||
    data.user.email.split("@")[0]

  const user = await prisma.user.upsert({
    where: { email: data.user.email },
    update: { name: displayName },
    create: {
      email: data.user.email,
      name: displayName,
      password: `supabase:${data.user.id}`,
    },
  })

  await ensureUserWorkspace(user.id, user.name)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    authProvider: "supabase",
  }
}
