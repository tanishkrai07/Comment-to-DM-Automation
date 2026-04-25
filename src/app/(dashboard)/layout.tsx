import { getCurrentUser } from "@/lib/current-user"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"
import type { Metadata } from "next"
import "./dashboard.css"

export const metadata: Metadata = {
  title: "CommentFlow Dashboard",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }

  return (
    <div className="app-layout">
      <Sidebar user={currentUser} />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
