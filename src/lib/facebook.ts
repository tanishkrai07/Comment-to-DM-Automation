const GRAPH_BASE = "https://graph.facebook.com/v19.0"

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface PageInfo {
  id: string
  name: string
  category?: string
}

/**
 * Send a Messenger DM to a user from a page.
 * Uses the Pages Messaging API.
 */
export async function sendDM(
  pageAccessToken: string,
  recipientId: string,
  message: string
): Promise<SendMessageResult> {
  try {
    const res = await fetch(`${GRAPH_BASE}/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: "RESPONSE",
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message ?? `HTTP ${res.status}`,
      }
    }

    return {
      success: true,
      messageId: data.message_id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Validate a page access token and retrieve basic page info.
 */
export async function getPageInfo(pageAccessToken: string): Promise<PageInfo | null> {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/me?fields=id,name,category&access_token=${pageAccessToken}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Exchange a short-lived code for a user access token.
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID ?? "",
      client_secret: process.env.META_APP_SECRET ?? "",
      redirect_uri: redirectUri,
      code,
    })

    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

/**
 * Get all pages managed by the user via their user access token.
 * Returns array of { id, name, access_token }.
 */
export async function getUserPages(userAccessToken: string): Promise<Array<{
  id: string
  name: string
  access_token: string
  category?: string
}>> {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/me/accounts?access_token=${userAccessToken}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

/**
 * Subscribe a page to webhook updates.
 */
export async function subscribePageToWebhook(pageAccessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/me/subscribed_apps?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: ["feed", "messages"],
        }),
      }
    )
    if (!res.ok) return false
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}
