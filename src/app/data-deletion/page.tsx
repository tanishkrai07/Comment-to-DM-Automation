import Link from "next/link"

export const metadata = {
  title: "Data Deletion Instructions - CommentFlow",
}

export default function DataDeletionPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, color: "#374151" }}>
      <Link href="/" style={{ color: "#7B61FF", textDecoration: "none", fontWeight: 600 }}>&larr; Back to Home</Link>
      <h1 style={{ color: "#111827", marginTop: 24 }}>User Data Deletion Instructions</h1>
      
      <p style={{ marginTop: 20 }}>
        CommentFlow is a Facebook application that allows Page administrators to automate Direct Messages. We value your privacy and make it easy to delete your data from our systems.
      </p>

      <h2 style={{ color: "#111827", marginTop: 32 }}>How to delete your data</h2>
      <p>If you wish to delete your account and all associated data, you can do so by following these steps:</p>
      
      <div style={{ background: "#F3F4F6", padding: 20, borderRadius: 8, marginTop: 16 }}>
        <h3 style={{ color: "#111827", marginTop: 0 }}>Option 1: From the Dashboard</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Log in to your CommentFlow dashboard.</li>
          <li>Navigate to the <strong>Pages</strong> tab.</li>
          <li>Click the <strong>Delete (Trash can)</strong> icon next to any connected Facebook page. This will instantly delete the page token, all associated automation triggers, and message logs from our database.</li>
        </ol>
      </div>

      <div style={{ background: "#F3F4F6", padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h3 style={{ color: "#111827", marginTop: 0 }}>Option 2: Email Request</h3>
        <p style={{ marginBottom: 0 }}>
          You can request a complete account deletion by emailing our support team at <strong>support@commentflow.io</strong> from the email address associated with your account. We will process your deletion request within 48 hours and remove all your data, including your encrypted Page tokens, user profile, and activity logs.
        </p>
      </div>

      <h2 style={{ color: "#111827", marginTop: 32 }}>Removing the App from Facebook</h2>
      <p>You can also remove CommentFlow&apos;s access directly from your Facebook settings at any time:</p>
      <ol>
        <li>Go to your Facebook Settings & Privacy &gt; Settings.</li>
        <li>Click on <strong>Business Integrations</strong> in the left menu.</li>
        <li>Find "Comment to DM Automation" in the list and click <strong>Remove</strong>.</li>
      </ol>
      <p><em>Note: Removing the app from Facebook revokes our access immediately, but to permanently delete your historical data from our servers, please follow Option 1 or Option 2 above.</em></p>
    </div>
  )
}
