import Stripe from "stripe"
import type { PlanTier, ClinicSettings } from "@/types"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { PLANS } from "@/lib/constants"

// ─── Stripe Client ───

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key, { apiVersion: "2026-02-25.clover" })
}

let _stripe: Stripe | null = null

export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}

// ─── Price ID Mapping ───

/**
 * 環境変数から Stripe Price ID を取得する。
 * 例: STRIPE_PRICE_STARTER_MONTHLY=price_xxx
 *     STRIPE_PRICE_STANDARD_YEARLY=price_yyy
 */
export function getStripePriceId(
  plan: PlanTier,
  cycle: "monthly" | "yearly"
): string | null {
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`
  return process.env[envKey] ?? null
}

/** 有料プランかどうか */
export function isPaidPlan(plan: PlanTier): boolean {
  return PLANS[plan].price > 0
}

// ─── Stripe Customer ───

/** Stripe Customer を取得 or 作成してIDを返す */
export async function getOrCreateStripeCustomer(
  clinicId: string,
  email: string,
  clinicName: string
): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings

  // 既存のCustomer IDがあればそのまま返す
  if (settings.stripeCustomerId) {
    return settings.stripeCustomerId
  }

  // Stripe Customer を作成
  const customer = await stripe().customers.create({
    email,
    name: clinicName,
    metadata: {
      clinicId,
    },
  })

  // settings に保存
  const merged = { ...settings, stripeCustomerId: customer.id }
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { settings: merged as unknown as Prisma.InputJsonValue },
  })

  logger.info("Stripe customer created", {
    component: "stripe",
    clinicId,
    customerId: customer.id,
  })

  return customer.id
}

// ─── Checkout Session ───

export async function createCheckoutSession(params: {
  clinicId: string
  customerId: string
  plan: PlanTier
  cycle: "monthly" | "yearly"
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = getStripePriceId(params.plan, params.cycle)
  if (!priceId) {
    throw new Error(`Stripe Price ID not configured for ${params.plan}/${params.cycle}`)
  }

  return stripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        clinicId: params.clinicId,
        plan: params.plan,
        cycle: params.cycle,
      },
    },
    metadata: {
      clinicId: params.clinicId,
      plan: params.plan,
      cycle: params.cycle,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: "ja",
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
  })
}

// ─── Customer Portal ───

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: "ja",
  })
}

// ─── Webhook Signature Verification ───

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
  }
  return stripe().webhooks.constructEvent(body, signature, webhookSecret)
}

// ─── Subscription Helpers ───

/** Stripe Subscription Status → billingStatus マッピング */
export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): ClinicSettings["billingStatus"] {
  switch (status) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled"
    case "trialing":
      return "trialing"
    case "incomplete":
      return "incomplete"
    default:
      return "canceled"
  }
}

/** clinicId からサブスクリプションの metadata.plan を取得して settings を更新 */
export async function syncSubscriptionToClinic(
  subscription: Stripe.Subscription
): Promise<void> {
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) {
    logger.warn("Subscription missing clinicId metadata", {
      component: "stripe",
      subscriptionId: subscription.id,
    })
    return
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  if (!clinic) {
    logger.warn("Clinic not found for subscription sync", {
      component: "stripe",
      clinicId,
      subscriptionId: subscription.id,
    })
    return
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings
  const plan = (subscription.metadata.plan as PlanTier) || settings.plan
  const cycle = (subscription.metadata.cycle as "monthly" | "yearly") || settings.billingCycle
  const billingStatus = mapSubscriptionStatus(subscription.status)

  const patch: Partial<ClinicSettings> = {
    stripeSubscriptionId: subscription.id,
    billingStatus,
    billingCycle: cycle,
  }

  // サブスクリプションがアクティブなら plan を反映
  if (billingStatus === "active" || billingStatus === "trialing") {
    patch.plan = plan
  }

  // キャンセル済みならfreeに戻す（demo/specialは除外）
  if (billingStatus === "canceled" && settings.plan !== "demo" && settings.plan !== "special") {
    patch.plan = "free"
  }

  const merged = { ...settings, ...patch }
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { settings: merged as unknown as Prisma.InputJsonValue },
  })

  logger.info("Subscription synced to clinic", {
    component: "stripe",
    clinicId,
    subscriptionId: subscription.id,
    plan: patch.plan,
    billingStatus,
  })
}

/** BillingEvent を冪等に記録 */
export async function recordBillingEvent(params: {
  clinicId: string
  type: string
  stripeEventId: string
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.billingEvent.create({
      data: {
        clinicId: params.clinicId,
        type: params.type,
        stripeEventId: params.stripeEventId,
        amount: params.amount ?? null,
        currency: params.currency ?? "jpy",
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  } catch (err: unknown) {
    // Unique constraint violation = 既に処理済み（冪等性）
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      logger.info("Duplicate billing event ignored", {
        component: "stripe",
        stripeEventId: params.stripeEventId,
      })
      return
    }
    throw err
  }
}
