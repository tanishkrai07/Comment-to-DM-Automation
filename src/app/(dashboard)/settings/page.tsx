"use client"

import { useState } from "react"
import {
  Globe, Key, Bell, Shield, Copy, CheckCheck, ExternalLink,
  Terminal, ChevronRight,
} from "lucide-react"

function CopyField({ value, label, hint }: { value: string; label: string; hint?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="form-input" value={value} readOnly style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ padding: "8px 12px", flexShrink: 0 }} onClick={copy}>
          {copied ? <CheckCheck size={14} color="#22C55E" /> : <Copy size={14} />}
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  )
}

const sections = [
  { id: "webhook", label: "Webhook", icon: Globe },
  { id: "credentials", label: "Meta App", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("webhook")
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your workspace and Meta integration</p>
        </div>
      </div>

      <div className="page-content" style={{ flexDirection: "row", alignItems: "flex-start", gap: 24 }}>
        {/* Left nav */}
        <div style={{
          width: 200,
          flexShrink: 0,
          background: "white",
          border: "1px solid #E8EAF0",
          borderRadius: 14,
          padding: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%",
                padding: "9px 12px", borderRadius: 9, border: "none",
                background: activeSection === id ? "#EEE9FF" : "transparent",
                color: activeSection === id ? "#7B61FF" : "#6B7280",
                fontFamily: "inherit", fontSize: 13.5, fontWeight: activeSection === id ? 600 : 500,
                cursor: "pointer", transition: "all 0.15s", marginBottom: 2,
              }}
            >
              <Icon size={15} />
              <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              {activeSection === id && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Webhook */}
          {activeSection === "webhook" && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E8EAF0" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Globe size={18} color="#7B61FF" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#13131A" }}>Webhook Configuration</div>
                  <div style={{ fontSize: 12.5, color: "#9CA3AF" }}>Connect your Facebook App to receive comment events</div>
                </div>
              </div>

              <CopyField
                label="Webhook URL"
                value={`${baseUrl}/api/webhook`}
                hint="Paste into Meta App → Webhooks → Callback URL"
              />
              <CopyField
                label="Verify Token"
                value={process.env.NEXT_PUBLIC_WEBHOOK_VERIFY_TOKEN ?? "commentflow_webhook_verify_token_change_me"}
                hint="Set META_WEBHOOK_VERIFY_TOKEN in .env.local and paste that value in Meta App → Webhooks → Verify Token"
              />

              {/* ngrok guide */}
              <div style={{
                marginTop: 8, padding: 18, background: "#FAFBFC",
                border: "1px solid #E8EAF0", borderRadius: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Terminal size={15} color="#F59E0B" />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#13131A" }}>Local dev: expose with ngrok</span>
                </div>
                {[
                  { n: "1", code: "brew install ngrok/ngrok/ngrok", desc: "Install ngrok" },
                  { n: "2", code: "ngrok http 3000", desc: "Expose localhost:3000" },
                  { n: "3", code: "https://abc.ngrok.io/api/webhook", desc: "Use as the Callback URL in Meta App" },
                ].map(({ n, code, desc }) => (
                  <div key={n} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: "#EEE9FF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: "#7B61FF",
                    }}>{n}</div>
                    <div>
                      <code style={{ display: "block", fontSize: 11.5, color: "#7B61FF", background: "#EEE9FF", padding: "3px 8px", borderRadius: 5, marginBottom: 2 }}>
                        {code}
                      </code>
                      <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta credentials */}
          {activeSection === "credentials" && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E8EAF0" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Key size={18} color="#7B61FF" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#13131A" }}>Meta App Credentials</div>
                  <div style={{ fontSize: 12.5, color: "#9CA3AF" }}>Add these environment variables to .env.local</div>
                </div>
              </div>

              {[
                { key: "META_APP_ID", label: "Meta App ID", desc: "From Meta App Dashboard → Settings → Basic" },
                { key: "META_APP_SECRET", label: "Meta App Secret", desc: "Meta App → Settings → Basic → App Secret" },
                { key: "META_WEBHOOK_VERIFY_TOKEN", label: "Webhook Verify Token", desc: "Any secret string — must match what you enter in Meta App → Webhooks" },
                { key: "ENCRYPTION_KEY", label: "Encryption Key (32 chars)", desc: "32-char random string for AES-256 encryption of page access tokens" },
                { key: "NEXTAUTH_SECRET", label: "NextAuth Secret", desc: "Random string for NextAuth session signing (run: openssl rand -base64 32)" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{
                      fontSize: 11.5, color: "#7B61FF", background: "#EEE9FF",
                      padding: "3px 9px", borderRadius: 5, flexShrink: 0, whiteSpace: "nowrap",
                    }}>{key}</code>
                    <input
                      className="form-input"
                      type={key.includes("SECRET") || key.includes("KEY") ? "password" : "text"}
                      placeholder="Not set — add to .env.local"
                      readOnly
                    />
                  </div>
                  <span className="form-hint">{desc}</span>
                </div>
              ))}

              <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener" className="btn btn-ghost btn-sm" style={{ marginTop: 4, textDecoration: "none" }}>
                <ExternalLink size={13} /> Open Meta for Developers
              </a>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E8EAF0" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={18} color="#F59E0B" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#13131A" }}>Notifications</div>
                  <div style={{ fontSize: 12.5, color: "#9CA3AF" }}>Alerts for failures and important events</div>
                </div>
              </div>

              {[
                { label: "Notify on delivery failure", defaultChecked: true, desc: "Alert when a DM fails to send" },
                { label: "Notify on webhook errors", defaultChecked: true, desc: "Alert on invalid webhook payloads" },
                { label: "Daily summary email", defaultChecked: false, desc: "Daily report of DMs sent and errors" },
                { label: "New page connection alert", defaultChecked: true, desc: "Alert when a new page is connected via OAuth" },
              ].map(({ label, defaultChecked, desc }) => (
                <div key={label} className="info-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 0" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#13131A" }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{desc}</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={defaultChecked} />
                      <span className="toggle-track" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E8EAF0" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={18} color="#22C55E" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#13131A" }}>Security</div>
                  <div style={{ fontSize: 12.5, color: "#9CA3AF" }}>How CommentFlow protects your data</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { title: "AES-256-GCM Encryption", desc: "Page access tokens are encrypted before storing in the database" },
                  { title: "Webhook Signature Validation", desc: "All Meta webhook payloads verified via X-Hub-Signature-256" },
                  { title: "Session Protection", desc: "All API routes protected with NextAuth session validation" },
                  { title: "Bcrypt Password Hashing", desc: "Passwords hashed with bcrypt (cost factor 12)" },
                  { title: "Cooldown DM Protection", desc: "Configurable cooldown prevents spamming the same user" },
                  { title: "Idempotency Keys", desc: "Duplicate webhook events are safely deduplicated" },
                  { title: "Instant Page Disable", desc: "Any page can be disabled immediately from the Pages screen" },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", background: "#ECFDF5",
                      border: "1.5px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <CheckCheck size={11} color="#22C55E" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#13131A" }}>{title}</div>
                      <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
