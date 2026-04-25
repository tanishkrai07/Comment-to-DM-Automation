"use client"

import { useEffect, useState } from "react"
import { ScrollText, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface LogEvent {
  id: string
  eventType: string
  processedStatus: string
  errorMessage: string | null
  rawPayload: string | null
  createdAt: string
  page: { pageName: string }
  trigger: { triggerName: string; keyword: string } | null
}

const STATUS_FILTERS = ["all", "sent", "no_match", "error", "skipped_cooldown", "processing"]

function getStatusClass(status: string) {
  if (status === "sent") return "badge badge-success"
  if (status === "error") return "badge badge-error"
  if (status === "no_match") return "badge badge-neutral"
  if (status === "skipped_cooldown") return "badge badge-warning"
  return "badge badge-neutral"
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    const res = await fetch("/api/logs")
    if (res.ok) setLogs((await res.json()).logs)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadLogs() {
      const res = await fetch("/api/logs")
      if (!cancelled && res.ok) setLogs((await res.json()).logs)
      if (!cancelled) setLoading(false)
    }

    void loadLogs()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = filter === "all" ? logs : logs.filter(l => l.processedStatus === filter)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Event Logs</h1>
            <p className="page-subtitle">Every comment and DM event processed by your automations</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => {
            const count = s === "all" ? logs.length : logs.filter(l => l.processedStatus === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid",
                  borderColor: filter === s ? "#7B61FF" : "#E8EAF0",
                  background: filter === s ? "#EEE9FF" : "white",
                  color: filter === s ? "#7B61FF" : "#6B7280",
                  fontSize: 13,
                  fontWeight: filter === s ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {s.replace("_", " ")} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
              </button>
            )
          })}
        </div>

        <div className="card">
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF" }}>
              <Loader2 size={20} className="spin" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13 }}>Loading logs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ScrollText size={22} /></div>
              <p className="empty-title">No events yet</p>
              <p className="empty-desc">
                When someone comments on your connected pages, the events will appear here in real time.
              </p>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <>
                      <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td>
                          <span className={getStatusClass(log.processedStatus)}>
                            <span className="badge-dot" />
                            {log.processedStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="td-primary" style={{ textTransform: "capitalize" }}>
                          {log.eventType.replace("_", " ")}
                        </td>
                        <td>{log.page?.pageName ?? "—"}</td>
                        <td>
                          {log.trigger ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {log.trigger.triggerName}
                              <span className="keyword-chip" style={{ fontSize: 10.5, padding: "2px 7px" }}>
                                {log.trigger.keyword}
                              </span>
                            </span>
                          ) : <span style={{ color: "#D1D5DB" }}>no match</span>}
                        </td>
                        <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {formatRelativeTime(log.createdAt)}
                        </td>
                        <td>
                          {expandedId === log.id ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedId === log.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#FAFBFC", padding: "12px 16px" }}>
                            {log.errorMessage && (
                              <div style={{
                                padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA",
                                borderRadius: 8, fontSize: 12.5, color: "#DC2626", marginBottom: 8,
                                fontFamily: "monospace",
                              }}>
                                Error: {log.errorMessage}
                              </div>
                            )}
                            {log.rawPayload && (
                              <pre style={{
                                fontSize: 11.5, color: "#374151", background: "#F4F6FA",
                                padding: "10px 14px", borderRadius: 8, overflow: "auto",
                                maxHeight: 200, fontFamily: "monospace",
                              }}>
                                {JSON.stringify(JSON.parse(log.rawPayload || "{}"), null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
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
