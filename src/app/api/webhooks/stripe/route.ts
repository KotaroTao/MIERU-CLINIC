import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { constructWebhookEvent, syncSubscriptionToClinic, recordBillingEvent, stripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook ハンドラ。認証不要（Stripe署名で検証）。
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error("Webhook signature verification failed", {
      component: "stripe-webhook",
      error: message,
    })
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  logger.info(`Stripe webhook received: ${event.type}`, {
    component: "stripe-webhook",
    eventId: event.id,
    type: event.type,
  })

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event)
        break

      case "invoice.paid":
        await handleInvoicePaid(event)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event)
        break

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`, {
          component: "stripe-webhook",
        })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Webhook handler error for ${event.type}`, {
      component: "stripe-webhook",
      eventId: event.id,
      error: message,
    })
    // 500を返すとStripeがリトライするため、処理エラーでも200を返す
    // ただし記録用にログは出す
  }

  return NextResponse.json({ received: true })
}

// ─── Helpers ───

/** Invoice から subscription ID を抽出 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === "string" ? sub : sub.id
}

// ─── Event Handlers ───

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const clinicId = session.metadata?.clinicId
  if (!clinicId) return

  // Subscription を取得して同期
  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id
    const subscription = await stripe().subscriptions.retrieve(subscriptionId)
    await syncSubscriptionToClinic(subscription)
  }

  await recordBillingEvent({
    clinicId,
    type: "checkout_completed",
    stripeEventId: event.id,
    amount: session.amount_total ?? undefined,
    currency: session.currency ?? "jpy",
    metadata: {
      sessionId: session.id,
      plan: session.metadata?.plan,
      cycle: session.metadata?.cycle,
    },
  })
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  const subscription = await stripe().subscriptions.retrieve(subscriptionId)
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) return

  await syncSubscriptionToClinic(subscription)

  await recordBillingEvent({
    clinicId,
    type: "payment_succeeded",
    stripeEventId: event.id,
    amount: invoice.amount_paid ?? undefined,
    currency: invoice.currency ?? "jpy",
    metadata: {
      invoiceId: invoice.id,
      subscriptionId,
    },
  })
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  const subscription = await stripe().subscriptions.retrieve(subscriptionId)
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) return

  await syncSubscriptionToClinic(subscription)

  await recordBillingEvent({
    clinicId,
    type: "payment_failed",
    stripeEventId: event.id,
    amount: invoice.amount_due ?? undefined,
    currency: invoice.currency ?? "jpy",
    metadata: {
      invoiceId: invoice.id,
      subscriptionId,
      attemptCount: invoice.attempt_count,
    },
  })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) return

  await syncSubscriptionToClinic(subscription)

  await recordBillingEvent({
    clinicId,
    type: "subscription_updated",
    stripeEventId: event.id,
    metadata: {
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: subscription.metadata.plan,
    },
  })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) return

  await syncSubscriptionToClinic(subscription)

  await recordBillingEvent({
    clinicId,
    type: "subscription_deleted",
    stripeEventId: event.id,
    metadata: {
      subscriptionId: subscription.id,
      canceledAt: subscription.canceled_at,
    },
  })
}
