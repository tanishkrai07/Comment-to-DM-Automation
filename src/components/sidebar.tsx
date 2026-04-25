"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Globe,
  Zap,
  MessageSquare,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  MessageCircle,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pages", label: "Pages", icon: Globe },
  { href: "/triggers", label: "Triggers", icon: Zap },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  return (
    <aside style={{
      width: 248,
      minHeight: "100vh",
      background: "white",
      borderRight: "1px solid #E8EAF0",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid #E8EAF0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg, #7B61FF, #6448FF)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 12px rgba(123,97,255,0.3)",
            flexShrink: 0,
          }}>
            <MessageCircle size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#13131A", letterSpacing: "-0.3px" }}>
              CommentFlow
            </div>
            <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 0.5 }}>
              DM Automation
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9CA3AF",
          padding: "0 10px",
          marginBottom: 6,
          marginTop: 2,
        }}>
          Main
        </div>

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                color: active ? "#7B61FF" : "#6B7280",
                textDecoration: "none",
                background: active ? "#EEE9FF" : "transparent",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#F7F8FB"
                  e.currentTarget.style.color = "#13131A"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#6B7280"
                }
              }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}

        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9CA3AF",
          padding: "0 10px",
          marginBottom: 6,
          marginTop: 12,
        }}>
          Account
        </div>

        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                color: active ? "#7B61FF" : "#6B7280",
                textDecoration: "none",
                background: active ? "#EEE9FF" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#F7F8FB"
                  e.currentTarget.style.color = "#13131A"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#6B7280"
                }
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div style={{
        padding: "14px 12px",
        borderTop: "1px solid #E8EAF0",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {/* User info */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          borderRadius: 9,
          background: "#F7F8FB",
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7B61FF, #6448FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#13131A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.name ?? "User"}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 12px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 500,
            color: "#9CA3AF",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FEF2F2"
            e.currentTarget.style.color = "#EF4444"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "#9CA3AF"
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
