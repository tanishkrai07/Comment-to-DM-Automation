import Link from "next/link"

export const metadata = {
  title: "Privacy Policy - CommentFlow",
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, color: "#374151" }}>
      <Link href="/" style={{ color: "#7B61FF", textDecoration: "none", fontWeight: 600 }}>&larr; Back to Home</Link>
      <h1 style={{ color: "#111827", marginTop: 24 }}>Privacy Policy</h1>
      <p style={{ color: "#6B7280" }}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>1. Information We Collect</h2>
      <p>We collect information you provide directly to us when you create an account, such as your name and email address. When you connect your Facebook Page, we receive your Page Access Token and basic profile information from Meta to provide the comment-to-DM automation service.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>2. How We Use Your Information</h2>
      <p>We use the information we collect to operate, maintain, and provide the features of CommentFlow. Specifically, we use your Facebook Page Access Token strictly to listen for comment webhooks and send automated Direct Messages on your behalf as configured in your dashboard.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>3. Data Security</h2>
      <p>Your security is our priority. All Facebook Page Access Tokens are securely encrypted using AES-256-GCM before being stored in our database. We do not share or sell your personal information or connected page data to third parties.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>4. Third-Party Services</h2>
      <p>We use Meta&apos;s Graph API to provide our core functionality. By using CommentFlow, you also agree to be bound by the Facebook Terms of Service and Privacy Policy.</p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>5. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at support@commentflow.io.</p>
    </div>
  )
}
