"use client"

import { useEffect, useState } from "react"
import {
  Globe, Plus, Trash2, Loader2, X, ExternalLink, Link2,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Page {
  id: string
  pageName: string
  facebookPageId: string
  pageAvatarUrl: string | null
  status: string
  permissionsStatus: string
  createdAt: string
  _count: { triggers: number; conversations: number }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return (
    <span className="badge badge-success"><span className="badge-dot" />Active</span>
  )
  if (status === "paused") return (
    <span className="badge badge-warning"><span className="badge-dot" />Paused</span>
  )
  return <span className="badge badge-error"><span className="badge-dot" />Error</span>
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ pageName: "", facebookPageId: "", pageAccessToken: "" })

  const fetchPages = async () => {
    setLoading(true)
    const res = await fetch("/api/pages")
    if (res.ok) setPages((await res.json()).pages)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadPages() {
      const res = await fetch("/api/pages")
      if (!cancelled && res.ok) setPages((await res.json()).pages)
      if (!cancelled) setLoading(false)
    }

    void loadPages()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowModal(false)
    setSaving(false)
    setForm({ pageName: "", facebookPageId: "", pageAccessToken: "" })
    fetchPages()
  }

  const toggleStatus = async (page: Page) => {
    const newStatus = page.status === "active" ? "paused" : "active"
    await fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, status: newStatus }),
    })
    fetchPages()
  }

  const deletePage = async (id: string) => {
    if (!confirm("Delete this page? All triggers and data for this page will also be deleted.")) return
    await fetch(`/api/pages?id=${id}`, { method: "DELETE" })
    fetchPages()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Pages</h1>
            <p className="page-subtitle">Manage your connected Facebook Pages</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Page
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
            <Loader2 size={22} className="spin" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13 }}>Loading pages…</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Globe size={24} /></div>
              <p className="empty-title">No pages connected yet</p>
              <p className="empty-desc">
                Connect your Facebook Page to start receiving comment events and sending automated DMs.
              </p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 4 }}>
                <Plus size={15} /> Connect your first page
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pages.map((page) => (
              <div key={page.id} className="page-card">
                {/* Avatar */}
                <div className="page-avatar">
                  {page.pageAvatarUrl ? (
                    <img src={page.pageAvatarUrl} alt={page.pageName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    page.pageName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#13131A" }}>{page.pageName}</span>
                    <StatusBadge status={page.status} />
                    {page.permissionsStatus !== "ok" && (
                      <span className="badge badge-warning"><span className="badge-dot" />Permissions needed</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      ID: <code style={{ background: "#F4F6FA", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>{page.facebookPageId}</code>
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {page._count.triggers} trigger{page._count.triggers !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {page._count.conversations} conversation{page._count.conversations !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      Connected {formatRelativeTime(page.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <label className="toggle" title={page.status === "active" ? "Pause automation" : "Resume automation"}>
                    <input type="checkbox" checked={page.status === "active"} onChange={() => toggleStatus(page)} />
                    <span className="toggle-track" />
                  </label>
                  <button className="btn btn-danger btn-sm" onClick={() => deletePage(page.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meta OAuth Info */}
        <div className="card" style={{ borderLeft: "3px solid #7B61FF" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#EEE9FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Link2 size={17} color="#7B61FF" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#13131A", marginBottom: 4 }}>
                Connect via Facebook OAuth
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 12 }}>
                For production use, connect your Facebook page via OAuth to get a proper long-lived page access token. This enables real comment-to-DM automation.
              </div>
              <a
                href="/api/fb-oauth"
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: "none" }}
              >
                <ExternalLink size={13} />
                Connect via Facebook OAuth
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Page Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Facebook Page</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Page Name *</label>
                <input
                  className="form-input"
                  placeholder="My Business Page"
                  value={form.pageName}
                  onChange={(e) => setForm({ ...form, pageName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facebook Page ID</label>
                <input
                  className="form-input"
                  placeholder="123456789012345 (optional for testing)"
                  value={form.facebookPageId}
                  onChange={(e) => setForm({ ...form, facebookPageId: e.target.value })}
                />
                <span className="form-hint">Leave blank to auto-generate a test ID</span>
              </div>

              <div className="form-group">
                <label className="form-label">Page Access Token</label>
                <input
                  className="form-input"
                  placeholder="EAABwzLixnjYBO... (from Meta Business Suite)"
                  value={form.pageAccessToken}
                  onChange={(e) => setForm({ ...form, pageAccessToken: e.target.value })}
                  type="password"
                />
                <span className="form-hint">This is encrypted with AES-256 before storing</span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !form.pageName}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                  {saving ? "Adding…" : "Add Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
