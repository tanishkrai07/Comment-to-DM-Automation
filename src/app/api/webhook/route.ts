// app/api/webhook/route.ts
// Receives ALL events from Meta — comment webhooks + Messenger replies (v2)

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { processCommentEvent, processMessageReply } from '@/lib/trigger-engine'

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!
const APP_SECRET   = process.env.META_APP_SECRET!

interface WebhookPayload {
  object?: string
  entry?: WebhookEntry[]
}

interface WebhookEntry {
  id: string
  changes?: Array<{
    field?: string
    value?: {
      item?: string
      from?: { id?: string }
      message?: string
      comment_id?: string
    }
  }>
  messaging?: Array<{
    sender?: { id?: string }
    message?: {
      is_echo?: boolean
      text?: string
      mid?: string
    }
  }>
}

// ─────────────────────────────────────────
// GET — Meta webhook verification handshake
// ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[webhook] Verification failed — token mismatch')
  return new NextResponse('Forbidden', { status: 403 })
}

// ─────────────────────────────────────────
// POST — Live events from Meta
// ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('x-hub-signature-256')

  // Validate signature (Meta signs all payloads with your app secret)
  if (APP_SECRET && signature) {
    const expected = 'sha256=' + crypto
      .createHmac('sha256', APP_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expected) {
      console.error('[webhook] Invalid signature — rejecting request')
      return new NextResponse('Invalid signature', { status: 403 })
    }
  }

  let data: WebhookPayload
  try {
    data = JSON.parse(body)
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  // Only handle page events
  if (data.object !== 'page') {
    return NextResponse.json({ status: 'ignored' })
  }

  // Process all entries asynchronously (don't await — respond to Meta fast)
  processEntries(data.entry || []).catch(console.error)

  // Meta requires a 200 response within 20 seconds
  return NextResponse.json({ status: 'ok' })
}

// ─────────────────────────────────────────
// Event processing
// ─────────────────────────────────────────

async function processEntries(entries: WebhookEntry[]) {
  for (const entry of entries) {
    const facebookPageId = entry.id

    // ── Comment events (from page feed subscription) ──
    for (const change of entry.changes || []) {
      if (change.field === 'feed' && change.value?.item === 'comment') {
        const val         = change.value
        const userPsid    = val.from?.id
        const commentText = val.message
        const commentId   = val.comment_id

        if (!userPsid || !commentText || !commentId) continue

        // Skip comments made by the page itself
        if (userPsid === facebookPageId) continue

        console.log(`[webhook] Comment from ${userPsid}: "${commentText}"`)

        await processCommentEvent({
          facebookPageId,
          userPsid,
          commentText,
          commentId,
        }).catch(err => console.error('[webhook] processCommentEvent error:', err))
      }
    }

    // ── Messenger message events (user replying to a DM) ──
    for (const messagingEvent of entry.messaging || []) {
      // Skip echoes (messages sent BY the page, not received)
      if (messagingEvent.message?.is_echo) continue

      const userPsid    = messagingEvent.sender?.id
      const messageText = messagingEvent.message?.text
      const messageId   = messagingEvent.message?.mid

      if (!userPsid || !messageText || !messageId) continue

      console.log(`[webhook] Message reply from ${userPsid}: "${messageText}"`)

      await processMessageReply({
        facebookPageId,
        userPsid,
        messageText,
        messageId,
      }).catch(err => console.error('[webhook] processMessageReply error:', err))
    }
  }
}
