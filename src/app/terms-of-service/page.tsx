import Link from "next/link"

export const metadata = {
  title: "Terms of Service - CommentFlow",
}

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, color: "#374151" }}>
      <Link href="/" style={{ color: "#7B61FF", textDecoration: "none", fontWeight: 600 }}>&larr; Back to Home</Link>
      <h1 style={{ color: "#111827", marginTop: 24 }}>Terms of Service</h1>
      <p style={{ color: "#6B7280" }}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>1. Acceptance of Terms</h2>
      <p>By accessing and using CommentFlow, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>2. Description of Service</h2>
      <p>CommentFlow provides an automation tool that allows Facebook Page administrators to automatically send Direct Messages in response to comments on their posts. You are solely responsible for ensuring your automated messages comply with Meta&apos;s Platform Terms and Policies.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>3. User Conduct and Meta Compliance</h2>
      <p>You agree to use the Service only for lawful purposes. You agree not to use the Service to spam users, send unsolicited promotional content without consent, or violate any of Meta&apos;s official policies. We reserve the right to suspend or terminate accounts that violate these terms or trigger spam flags on Facebook.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>4. Account Security</h2>
      <p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>5. Limitation of Liability</h2>
      <p>CommentFlow shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
    </div>
  )
}
