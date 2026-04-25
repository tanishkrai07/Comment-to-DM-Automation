"use client"

import { useEffect, useState } from "react"
import { BarChart3, Loader2, TrendingUp, MessageSquare, Zap, Globe, RefreshCw } from "lucide-react"

interface AnalyticsData {
  totalDms: number
  successRate: number
  topTriggers: Array<{ triggerName: string; keyword: string; sentCount: number; matchCount: number }>
  pageStats: Array<{ pageName: string; dmsCount: number; errorCount: number }>
  eventsByStatus: Record<string, number>
  last7Days: Array<{ date: string; sent: number; errors: number }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    const res = await fetch("/api/analytics")
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      const res = await fetch("/api/analytics")
      if (!cancelled && res.ok) setData(await res.json())
      if (!cancelled) setLoading(false)
    }

    void loadAnalytics()
    return () => {
      cancelled = true
    }
  }, [])

  const maxDms = data?.topTriggers?.reduce((max, t) => Math.max(max, t.sentCount), 1) ?? 1

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Performance metrics for your automations</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchAnalytics}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
            <Loader2 size={22} className="spin" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13 }}>Loading analytics…</p>
          </div>
        ) : !data || data.totalDms === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><BarChart3 size={22} /></div>
              <p className="empty-title">No data yet</p>
              <p className="empty-desc">
                Analytics will appear here once your first trigger starts sending DMs. Set up a trigger and let it run!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="stats-grid">
              {[
                { label: "Total DMs Sent", value: data.totalDms, icon: MessageSquare, color: "#7B61FF", bg: "#EEE9FF" },
                { label: "Success Rate", value: `${data.successRate}%`, icon: TrendingUp, color: "#22C55E", bg: "#ECFDF5" },
                { label: "Active Triggers", value: data.topTriggers.length, icon: Zap, color: "#F59E0B", bg: "#FFFBEB" },
                { label: "Pages Tracked", value: data.pageStats.length, icon: Globe, color: "#3B82F6", bg: "#EFF6FF" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-label">{label}</span>
                    <div className="stat-icon" style={{ background: bg }}>
                      <Icon size={17} color={color} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ fontSize: typeof value === "string" ? 26 : 30 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Event status breakdown */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Events by Status</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(data.eventsByStatus).map(([status, count]) => {
                  const cls =
                    status === "sent" ? "badge badge-success" :
                    status === "error" ? "badge badge-error" :
                    status === "no_match" ? "badge badge-neutral" :
                    "badge badge-warning"
                  return (
                    <div key={status} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 16px", background: "#FAFBFC",
                      border: "1px solid #E8EAF0", borderRadius: 10,
                    }}>
                      <span className={cls}><span className="badge-dot" />{status.replace("_", " ")}</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#13131A" }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Triggers */}
            {data.topTriggers.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Top Performing Triggers</div>
                    <div className="card-subtitle">Ranked by DMs sent</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {data.topTriggers.map((t, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#13131A" }}>{t.triggerName}</span>
                          <span className="keyword-chip" style={{ fontSize: 10.5, padding: "2px 7px" }}>{t.keyword}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#7B61FF" }}>{t.sentCount} DMs</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(t.sentCount / maxDms) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Page breakdown */}
            {data.pageStats.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Page Performance</div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>DMs Sent</th>
                        <th>Errors</th>
                        <th>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pageStats.map((p, i) => {
                        const rate = p.dmsCount === 0 ? 0 : Math.round((p.dmsCount / (p.dmsCount + p.errorCount)) * 100)
                        return (
                          <tr key={i}>
                            <td className="td-primary">{p.pageName}</td>
                            <td style={{ color: "#7B61FF", fontWeight: 600 }}>{p.dmsCount}</td>
                            <td style={{ color: p.errorCount > 0 ? "#EF4444" : "#9CA3AF" }}>{p.errorCount}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div className="progress-bar" style={{ width: 60 }}>
                                  <div className="progress-fill" style={{ width: `${rate}%` }} />
                                </div>
                                <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
