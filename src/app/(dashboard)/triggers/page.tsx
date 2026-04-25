"use client"

import { useEffect, useState } from "react"
import {
  Zap, Plus, X, Loader2, Trash2, Pencil, ChevronDown, ChevronUp,
  ArrowDown,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Page { id: string; pageName: string }
interface TriggerStep { id?: string; message: string; delaySeconds: number }
interface Trigger {
  id: string
  triggerName: string
  keyword: string
  keywordMatchType: string
  cooldownMinutes: number
  isActive: boolean
  createdAt: string
  page: Page
  steps: TriggerStep[]
}

const MATCH_TYPES = [
  { value: "contains", label: "Contains" },
  { value: "exact", label: "Exact match" },
  { value: "starts_with", label: "Starts with" },
]

const defaultStep = (): TriggerStep => ({ message: "", delaySeconds: 0 })

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTrigger, setEditTrigger] = useState<Trigger | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    triggerName: "",
    keyword: "",
    keywordMatchType: "contains",
    cooldownMinutes: 1440,
    pageId: "",
    steps: [defaultStep()],
  })

  const fetchAll = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([fetch("/api/triggers"), fetch("/api/pages")])
    if (tRes.ok) setTriggers((await tRes.json()).triggers)
    if (pRes.ok) setPages((await pRes.json()).pages)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      const [tRes, pRes] = await Promise.all([fetch("/api/triggers"), fetch("/api/pages")])
      if (!cancelled && tRes.ok) setTriggers((await tRes.json()).triggers)
      if (!cancelled && pRes.ok) setPages((await pRes.json()).pages)
      if (!cancelled) setLoading(false)
    }

    void loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  const openNew = () => {
    setEditTrigger(null)
    setForm({
      triggerName: "",
      keyword: "",
      keywordMatchType: "contains",
      cooldownMinutes: 1440,
      pageId: pages[0]?.id ?? "",
      steps: [defaultStep()],
    })
    setShowModal(true)
  }

  const openEdit = (t: Trigger) => {
    setEditTrigger(t)
    setForm({
      triggerName: t.triggerName,
      keyword: t.keyword,
      keywordMatchType: t.keywordMatchType,
      cooldownMinutes: t.cooldownMinutes,
      pageId: t.page.id,
      steps: t.steps.length > 0 ? t.steps : [defaultStep()],
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasEmptySteps = form.steps.some(s => !s.message.trim())
    if (hasEmptySteps) { alert("All DM steps must have a message."); return }
    setSaving(true)

    if (editTrigger) {
      await fetch("/api/triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTrigger.id, ...form }),
      })
    } else {
      await fetch("/api/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    }
    setShowModal(false)
    setSaving(false)
    fetchAll()
  }

  const toggleActive = async (t: Trigger) => {
    await fetch("/api/triggers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
    })
    fetchAll()
  }

  const deleteTrigger = async (id: string) => {
    if (!confirm("Delete this trigger? This will stop the automation.")) return
    await fetch(`/api/triggers?id=${id}`, { method: "DELETE" })
    fetchAll()
  }

  const addStep = () => setForm({ ...form, steps: [...form.steps, defaultStep()] })
  const removeStep = (i: number) => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) })
  const updateStep = (i: number, field: keyof TriggerStep, value: string | number) => {
    const steps = [...form.steps]
    steps[i] = { ...steps[i], [field]: value }
    setForm({ ...form, steps })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Triggers</h1>
            <p className="page-subtitle">Keyword automations that fire your multi-step DM flows</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> New Trigger
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
            <Loader2 size={22} className="spin" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13 }}>Loading triggers…</p>
          </div>
        ) : triggers.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Zap size={24} /></div>
              <p className="empty-title">No triggers yet</p>
              <p className="empty-desc">
                A trigger watches for a keyword in comments and automatically fires a multi-step DM conversation.
                {pages.length === 0 && " Connect a Facebook page first."}
              </p>
              {pages.length > 0 && (
                <button className="btn btn-primary" onClick={openNew} style={{ marginTop: 4 }}>
                  <Plus size={15} /> Create your first trigger
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {triggers.map((t) => (
              <div
                key={t.id}
                className={`trigger-card ${t.isActive ? "active" : ""}`}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: t.isActive ? "#EEE9FF" : "#F3F4F6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: t.isActive ? "#7B61FF" : "#9CA3AF",
                    }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#13131A" }}>{t.triggerName}</div>
                      <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 1 }}>{t.page.pageName}</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={t.isActive} onChange={() => toggleActive(t)} />
                    <span className="toggle-track" />
                  </label>
                </div>

                {/* Keyword */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="keyword-chip">
                    <Zap size={10} />
                    {t.keyword}
                  </span>
                  <span className="match-chip">{t.keywordMatchType}</span>
                  <span className="match-chip">{t.steps.length} step{t.steps.length !== 1 ? "s" : ""}</span>
                  <span className="match-chip">
                    {t.cooldownMinutes >= 1440 ? `${Math.round(t.cooldownMinutes / 1440)}d cooldown` : `${t.cooldownMinutes}m cooldown`}
                  </span>
                </div>

                {/* Steps preview (collapsible) */}
                {t.steps.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, color: "#6B7280", fontFamily: "inherit", padding: 0,
                      }}
                    >
                      {expandedId === t.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {expandedId === t.id ? "Hide" : "Preview"} DM flow
                    </button>

                    {expandedId === t.id && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {t.steps.map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%", background: "#7B61FF",
                              color: "white", fontSize: 11, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              {i + 1}
                            </div>
                            <div style={{
                              flex: 1, background: "#F7F8FB", borderRadius: 8, padding: "8px 12px",
                              fontSize: 12.5, color: "#374151", lineHeight: 1.55,
                            }}>
                              {step.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    Created {formatRelativeTime(t.createdAt)}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTrigger(t.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Builder Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header" style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <div>
                <span className="modal-title">{editTrigger ? "Edit Trigger" : "New Trigger"}</span>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  Set a keyword and build your DM sequence
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <form onSubmit={handleSave}>
              {/* Step 1: Basic info */}
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">1 — Trigger details</div>
                <div className="form-group">
                  <label className="form-label">Trigger Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Free Guide Request"
                    value={form.triggerName}
                    onChange={(e) => setForm({ ...form, triggerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Keyword *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. FREE, link, info"
                      value={form.keyword}
                      onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Match Type</label>
                    <select
                      className="form-select"
                      value={form.keywordMatchType}
                      onChange={(e) => setForm({ ...form, keywordMatchType: e.target.value })}
                    >
                      {MATCH_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Facebook Page *</label>
                    <select
                      className="form-select"
                      value={form.pageId}
                      onChange={(e) => setForm({ ...form, pageId: e.target.value })}
                      required
                    >
                      <option value="">Select a page…</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>{p.pageName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cooldown (minutes)</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={form.cooldownMinutes}
                      onChange={(e) => setForm({ ...form, cooldownMinutes: parseInt(e.target.value) || 0 })}
                    />
                    <span className="form-hint">How long before same user can re-trigger (1440 = 24h)</span>
                  </div>
                </div>
              </div>

              {/* Step 2: DM Flow Builder */}
              <div>
                <div className="section-label">2 — DM flow sequence</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.steps.map((step, i) => (
                    <div key={i}>
                      <div className="step-card">
                        <div className="step-number">{i + 1}</div>
                        <textarea
                          className="step-textarea"
                          placeholder={i === 0
                            ? "Hey! Thanks for your comment 👋 Here's what I promised you..."
                            : "Great! Here's the next step..."}
                          value={step.message}
                          onChange={(e) => updateStep(i, "message", e.target.value)}
                          rows={3}
                        />
                        {form.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(i)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#9CA3AF", padding: 4, borderRadius: 4, flexShrink: 0,
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {i < form.steps.length - 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
                          <ArrowDown size={12} color="#9CA3AF" />
                          <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>User replies → next step sent</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addStep}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10 }}
                >
                  <Plus size={13} /> Add another step
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !form.pageId}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
                  {saving ? "Saving…" : editTrigger ? "Save Changes" : "Create Trigger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
