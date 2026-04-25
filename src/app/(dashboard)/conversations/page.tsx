"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Loader2, RefreshCw } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Conversation {
  id: string
  userPlatformId: string
  currentStep: number
  lastCommentText: string | null
  lastDmSentAt: string | null
  isComplete: boolean
  createdAt: string
  page: { pageName: string }
  trigger: { triggerName: string; keyword: string; steps: { id: string }[] } | null
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    setLoading(true)
    const res = await fetch("/api/conversations")
    if (res.ok) setConversations((await res.json()).conversations)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadConversations() {
      const res = await fetch("/api/conversations")
      if (!cancelled && res.ok) setConversations((await res.json()).conversations)
      if (!cancelled) setLoading(false)
    }

    void loadConversations()
    return () => {
      cancelled = true
    }
  }, [])

  const active = conversations.filter(c => !c.isComplete)
  const completed = conversations.filter(c => c.isComplete)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Conversations</h1>
            <p className="page-subtitle">Track users through your DM flows</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchConversations}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Summary */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {[
            { label: "Total", value: conversations.length, color: "#7B61FF", bg: "#EEE9FF" },
            { label: "Active", value: active.length, color: "#22C55E", bg: "#ECFDF5" },
            { label: "Completed", value: completed.length, color: "#6B7280", bg: "#F3F4F6" },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ fontSize: 26 }}>{loading ? "—" : value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">All Conversations</div>
              <div className="card-subtitle">Users who triggered a DM flow</div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF" }}>
              <Loader2 size={20} className="spin" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13 }}>Loading conversations…</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><MessageSquare size={22} /></div>
              <p className="empty-title">No conversations yet</p>
              <p className="empty-desc">
                When someone comments with a trigger keyword, their conversation will appear here so you can track their progress through the DM flow.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>User ID (PSID)</th>
                    <th>Page</th>
                    <th>Trigger</th>
                    <th>Step</th>
                    <th>Last Comment</th>
                    <th>Last DM</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => {
                    const totalSteps = c.trigger?.steps?.length ?? 1
                    const stepProgress = Math.min((c.currentStep / totalSteps) * 100, 100)

                    return (
                      <tr key={c.id}>
                        <td>
                          {c.isComplete ? (
                            <span className="badge badge-success">
                              <span className="badge-dot" /> Complete
                            </span>
                          ) : (
                            <span className="badge badge-brand">
                              <span className="badge-dot" /> Active
                            </span>
                          )}
                        </td>
                        <td>
                          <code style={{ fontSize: 11.5, background: "#F4F6FA", padding: "2px 7px", borderRadius: 5, color: "#374151" }}>
                            {c.userPlatformId.slice(0, 12)}…
                          </code>
                        </td>
                        <td className="td-primary">{c.page?.pageName ?? "—"}</td>
                        <td>
                          {c.trigger ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {c.trigger.triggerName}
                              <span className="keyword-chip" style={{ fontSize: 10.5, padding: "2px 7px" }}>
                                {c.trigger.keyword}
                              </span>
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>
                              {c.currentStep}/{totalSteps}
                            </span>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div className="progress-fill" style={{ width: `${stepProgress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: 160 }}>
                          {c.lastCommentText ? (
                            <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              &quot;{c.lastCommentText.slice(0, 40)}{c.lastCommentText.length > 40 ? "…" : ""}&quot;
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {c.lastDmSentAt ? formatRelativeTime(c.lastDmSentAt) : "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {formatRelativeTime(c.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
