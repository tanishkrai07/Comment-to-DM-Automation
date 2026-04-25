import { auth } from "@/lib/auth"
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
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
