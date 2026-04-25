// lib/trigger-engine.ts
// Core automation engine — comment matching → multi-step DM dispatch (v2)

import { prisma } from './prisma'
import { decryptToken } from './crypto'
import { sendDM } from './facebook'

interface MatchableTrigger {
  id: string
  keyword: string
  keywordMatchType: string
  cooldownMinutes: number
  triggerName: string
  steps: Array<{ id: string; stepOrder: number; message: string; delaySeconds: number }>
}

// ─────────────────────────────────────────────────────────────────
// ENTRY POINT 1: Handle a new comment on a page post
// ─────────────────────────────────────────────────────────────────

export async function processCommentEvent({
  facebookPageId,
  userPsid,
  commentText,
  commentId,
}: {
  facebookPageId: string
  userPsid: string
  commentText: string
  commentId: string
}) {
  const idempotencyKey = `comment_${commentId}_${userPsid}`

  // 1. Deduplicate — ignore if already processed
  const existing = await prisma.event.findUnique({ where: { idempotencyKey } })
  if (existing) {
    console.log(`[engine] Skipping duplicate event: ${idempotencyKey}`)
    return { skipped: true, reason: 'duplicate' }
  }

  // 2. Load page with active triggers + their steps
  const page = await prisma.page.findUnique({
    where: { facebookPageId },
    include: {
      triggers: {
        where: { isActive: true },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      },
    },
  })

  if (!page || page.status !== 'active') {
    return { error: 'Page not found or paused' }
  }

  // 3. Match keyword against active triggers
  const matchedTrigger = matchTrigger(commentText, page.triggers)

  // 4. Log the event (matched or not)
  const event = await prisma.event.create({
    data: {
      pageId: page.id,
      triggerId: matchedTrigger?.id ?? null,
      eventType: 'comment',
      rawPayload: JSON.stringify({ userPsid, commentText, commentId }),
      processedStatus: matchedTrigger ? 'processing' : 'no_match',
      idempotencyKey,
    },
  })

  if (!matchedTrigger) {
    console.log(`[engine] No trigger matched for: "${commentText}"`)
    return { matched: false }
  }

  // 5. Cooldown check
  const cooldownMs = matchedTrigger.cooldownMinutes * 60 * 1000
  const existingConv = await prisma.conversation.findUnique({
    where: {
      pageId_userPlatformId_triggerId: {
        pageId: page.id,
        userPlatformId: userPsid,
        triggerId: matchedTrigger.id,
      },
    },
  })

  if (existingConv?.lastDmSentAt) {
    const elapsed = Date.now() - existingConv.lastDmSentAt.getTime()
    if (elapsed < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - elapsed) / 60000)
      console.log(`[engine] Cooldown active for user ${userPsid} — ${minutesLeft}m remaining`)
      await prisma.event.update({
        where: { id: event.id },
        data: { processedStatus: 'skipped_cooldown' },
      })
      return { skipped: true, reason: 'cooldown', minutesLeft }
    }
  }

  // 6. Validate steps exist
  if (!matchedTrigger.steps.length) {
    await prisma.event.update({
      where: { id: event.id },
      data: { processedStatus: 'error', errorMessage: 'Trigger has no steps configured' },
    })
    return { error: 'No steps configured for trigger' }
  }

  // 7. Upsert conversation
  const conversation = await prisma.conversation.upsert({
    where: {
      pageId_userPlatformId_triggerId: {
        pageId: page.id,
        userPlatformId: userPsid,
        triggerId: matchedTrigger.id,
      },
    },
    create: {
      pageId: page.id,
      userPlatformId: userPsid,
      triggerId: matchedTrigger.id,
      lastCommentText: commentText,
      currentStep: 1,
      isComplete: false,
    },
    update: {
      lastCommentText: commentText,
      currentStep: 1,
      isComplete: false,
    },
  })

  // 8. Send step 1 immediately
  const firstStep = matchedTrigger.steps[0]
  const token = decryptToken(page.pageAccessTokenEncrypted)

  try {
    await dispatchStep({ token, userPsid, step: firstStep, conversationId: conversation.id, pageId: page.id })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastDmSentAt: new Date() },
    })

    await prisma.event.update({
      where: { id: event.id },
      data: { processedStatus: 'sent' },
    })

    console.log(`[engine] Sent step 1 to ${userPsid} for trigger "${matchedTrigger.triggerName}"`)
    return { success: true, conversationId: conversation.id, stepSent: 1 }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await prisma.event.update({
      where: { id: event.id },
      data: { processedStatus: 'error', errorMessage: message },
    })
    console.error(`[engine] Failed to send step 1:`, message)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────
// ENTRY POINT 2: Handle a reply DM from a user (advances the flow)
// ─────────────────────────────────────────────────────────────────

export async function processMessageReply({
  facebookPageId,
  userPsid,
  messageText,
  messageId,
}: {
  facebookPageId: string
  userPsid: string
  messageText: string
  messageId: string
}) {
  const idempotencyKey = `msg_${messageId}`
  const existing = await prisma.event.findUnique({ where: { idempotencyKey } })
  if (existing) return { skipped: true, reason: 'duplicate' }

  const page = await prisma.page.findUnique({ where: { facebookPageId } })
  if (!page) return { error: 'Page not found' }

  await prisma.event.create({
    data: {
      pageId: page.id,
      eventType: 'message_reply',
      rawPayload: JSON.stringify({ userPsid, messageText, messageId }),
      processedStatus: 'processing',
      idempotencyKey,
    },
  })

  const conversation = await prisma.conversation.findFirst({
    where: {
      pageId: page.id,
      userPlatformId: userPsid,
      isComplete: false,
    },
    include: {
      trigger: {
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!conversation?.trigger) {
    console.log(`[engine] No active conversation for user ${userPsid}`)
    return { noConversation: true }
  }

  const allSteps = conversation.trigger.steps
  const nextStepIndex = conversation.currentStep
  const nextStep = allSteps[nextStepIndex]

  if (!nextStep) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isComplete: true },
    })
    console.log(`[engine] Flow complete for user ${userPsid}`)
    return { complete: true }
  }

  const token = decryptToken(page.pageAccessTokenEncrypted)

  const sendStep = async () => {
    await dispatchStep({
      token,
      userPsid,
      step: nextStep,
      conversationId: conversation.id,
      pageId: page.id,
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        currentStep: conversation.currentStep + 1,
        lastDmSentAt: new Date(),
        isComplete: conversation.currentStep + 1 >= allSteps.length,
      },
    })
  }

  if (nextStep.delaySeconds > 0) {
    console.log(`[engine] Scheduling step ${nextStep.stepOrder} in ${nextStep.delaySeconds}s`)
    setTimeout(() => sendStep().catch(console.error), nextStep.delaySeconds * 1000)
  } else {
    await sendStep()
  }

  return { success: true, stepSent: nextStep.stepOrder }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

async function dispatchStep({
  token,
  userPsid,
  step,
  conversationId,
  pageId,
}: {
  token: string
  userPsid: string
  step: { id: string; stepOrder: number; message: string }
  conversationId: string
  pageId: string
}) {
  let providerMessageId: string | undefined
  let deliveryStatus = 'sent'

  try {
    const result = await sendDM(token, userPsid, step.message)
    providerMessageId = result?.messageId
    if (!result?.success) throw new Error(result?.error ?? 'DM send failed')
  } catch (err) {
    deliveryStatus = 'failed'
    await prisma.messageLog.create({
      data: {
        pageId,
        conversationId,
        messageText: step.message,
        deliveryStatus: 'failed',
        retryCount: 0,
        stepNumber: step.stepOrder,
      },
    })
    throw err
  }

  await prisma.messageLog.create({
    data: {
      pageId,
      conversationId,
      messageText: step.message,
      deliveryStatus,
      providerMessageId,
      stepNumber: step.stepOrder,
    },
  })
}

function matchTrigger(commentText: string, triggers: MatchableTrigger[]): MatchableTrigger | null {
  const normalized = commentText.toLowerCase().trim()

  for (const trigger of triggers) {
    const keyword = trigger.keyword.toLowerCase().trim()

    switch (trigger.keywordMatchType) {
      case 'exact':
        if (normalized === keyword) return trigger
        break
      case 'contains':
        if (normalized.includes(keyword)) return trigger
        break
      case 'starts_with':
        if (normalized.startsWith(keyword)) return trigger
        break
    }
  }

  return null
}
