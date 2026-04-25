"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageCircle, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [oauthError] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("error")
      ? "OAuth sign in failed. Check Supabase OAuth settings and try again."
      : ""
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4F6FA",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52,
            height: 52,
            background: "linear-gradient(135deg, #7B61FF, #6448FF)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 6px 20px rgba(123,97,255,0.35)",
          }}>
            <MessageCircle size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#13131A", letterSpacing: "-0.4px", marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13.5, color: "#9CA3AF" }}>Sign in to your CommentFlow account</p>
        </div>

        {/* Card */}
        <div style={{
          background: "white",
          border: "1px solid #E8EAF0",
          borderRadius: 18,
          padding: 32,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}>
          {(error || oauthError) && (
            <div style={{
              padding: "12px 16px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              fontSize: 13.5,
              color: "#DC2626",
              marginBottom: 20,
            }}>
              {error || oauthError}
            </div>
          )}

          <Link
            href="/api/auth/supabase/login?provider=google"
            style={{
              width: "100%",
              padding: "11px 16px",
              border: "1.5px solid #E8EAF0",
              borderRadius: 10,
              background: "white",
              color: "#13131A",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          >
            Continue with Google
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ height: 1, background: "#E8EAF0", flex: 1 }} />
            <span style={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>or</span>
            <div style={{ height: 1, background: "#E8EAF0", flex: 1 }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#13131A", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 13px",
                  border: "1.5px solid #E8EAF0",
                  borderRadius: 10,
                  fontSize: 13.5,
                  color: "#13131A",
                  outline: "none",
                  fontFamily: "inherit",
                  background: "#F4F6FA",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#7B61FF"
                  e.target.style.background = "white"
                  e.target.style.boxShadow = "0 0 0 3px rgba(123,97,255,0.12)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E8EAF0"
                  e.target.style.background = "#F4F6FA"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#13131A", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 13px",
                    border: "1.5px solid #E8EAF0",
                    borderRadius: 10,
                    fontSize: 13.5,
                    color: "#13131A",
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#F4F6FA",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#7B61FF"
                    e.target.style.background = "white"
                    e.target.style.boxShadow = "0 0 0 3px rgba(123,97,255,0.12)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E8EAF0"
                    e.target.style.background = "#F4F6FA"
                    e.target.style.boxShadow = "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 16px",
                background: loading ? "#A78BFF" : "linear-gradient(135deg, #7B61FF, #6448FF)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(123,97,255,0.3)",
                transition: "all 0.15s",
                marginTop: 4,
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 13.5, color: "#9CA3AF", marginTop: 20 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#7B61FF", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
