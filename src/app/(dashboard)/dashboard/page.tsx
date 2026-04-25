"use client"

import { useEffect, useState } from "react"
import {
  Globe, Zap, MessageSquare, AlertTriangle,
  RefreshCw, ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

interface DashboardData {
  pagesCount: number
  triggersCount: number
  dmsSentToday: number
  errorCount: number
  recentActivity: Array<{
    id: string
    eventType: string
    processedStatus: string
    createdAt: string
    page: { pageName: string }
    trigger: { triggerName: string; keyword: string } | null
  }>
}

const statCards = [
  {
    key: "pagesCount",
    label: "Connected Pages",
    icon: Globe,
    color: "#7B61FF",
    bg: "#EEE9FF",
    description: "Facebook pages linked",
    href: "/pages",
  },
  {
    key: "triggersCount",
    label: "Active Triggers",
    icon: Zap,
    color: "#F59E0B",
    bg: "#FFFBEB",
    description: "Keyword automations running",
    href: "/triggers",
  },
  {
    key: "dmsSentToday",
    label: "DMs Sent Today",
    icon: MessageSquare,
    color: "#22C55E",
    bg: "#ECFDF5",
    description: "Messages delivered",
    href: "/logs",
  },
  {
    key: "errorCount",
    label: "Errors",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "#FEF2F2",
    description: "Failed events",
    href: "/logs",
  },
]

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    sent: "badge badge-success",
    error: "badge badge-error",
    no_match: "badge badge-neutral",
    processing: "badge badge-warning",
    skipped_cooldown: "badge badge-neutral",
    pending: "badge badge-warning",
  }
  return map[status] ?? "badge badge-neutral"
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch("/api/dashboard")
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const res = await fetch("/api/dashboard")
      if (!cancelled && res.ok) setData(await res.json())
      if (!cancelled) setLoading(false)
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const isNew = !loading && (data?.pagesCount ?? 0) === 0

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your automation performance</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Onboarding checklist for new users */}
        {isNew && (
          <div style={{
            background: "linear-gradient(135deg, #7B61FF 0%, #6448FF 100%)",
            borderRadius: 16,
            padding: "24px 28px",
            color: "white",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Welcome to CommentFlow 👋</div>
              <div style={{ fontSize: 13.5, opacity: 0.85, maxWidth: 420, lineHeight: 1.65 }}>
                Start your first automation in 3 steps. Get a comment — send a DM. That simple.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { step: "1", title: "Connect a Page", href: "/pages" },
                { step: "2", title: "Create a Trigger", href: "/triggers" },
                { step: "3", title: "Watch it work", href: "/logs" },
              ].map(({ step, title, href }) => (
                <Link
                  key={step}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.25)",
                    textDecoration: "none",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    backdropFilter: "blur(8px)",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                  }}>{step}</span>
                  {title}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="stats-grid">
          {statCards.map(({ key, label, icon: Icon, color, bg, description, href }) => (
            <Link key={key} href={href} style={{ textDecoration: "none" }}>
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">{label}</span>
                  <div className="stat-icon" style={{ background: bg }}>
                    <Icon size={17} color={color} />
                  </div>
                </div>
                <div className="stat-value">
                  {loading ? (
                    <span style={{ color: "#D1D5DB", fontSize: 22 }}>—</span>
                  ) : (
                    (data?.[key as keyof DashboardData] as number) ?? 0
                  )}
                </div>
                <div className="stat-desc">{description}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest comment and DM events</div>
            </div>
            <Link href="/logs" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF" }}>
              <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13 }}>Loading activity…</p>
            </div>
          ) : !data?.recentActivity?.length ? (
            <div className="empty-state">
              <div className="empty-icon">
                <MessageSquare size={22} />
              </div>
              <p className="empty-title">No activity yet</p>
              <p className="empty-desc">
                Connect a Facebook page and create a keyword trigger to start seeing live events here.
              </p>
              <Link href="/pages" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
                Connect your first page
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Event Type</th>
                    <th>Page</th>
                    <th>Trigger</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <span className={getStatusBadge(event.processedStatus)}>
                          <span className="badge-dot" />
                          {event.processedStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="td-primary" style={{ textTransform: "capitalize" }}>
                        {event.eventType.replace("_", " ")}
                      </td>
                      <td>{event.page?.pageName ?? "—"}</td>
                      <td>
                        {event.trigger ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {event.trigger.triggerName}
                            <span className="keyword-chip" style={{ fontSize: 10.5, padding: "2px 7px" }}>
                              {event.trigger.keyword}
                            </span>
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ color: "#9CA3AF", fontSize: 12 }}>
                        {formatRelativeTime(event.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
