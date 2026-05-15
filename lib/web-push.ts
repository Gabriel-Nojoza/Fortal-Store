import webpush from "web-push"
import { getPushSubscriptions, removePushSubscription } from "@/lib/push-subscription-store"
import type { Order } from "@/lib/types"

function getPushConfig() {
  const publicKey =
    process.env.WEB_PUSH_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    ""
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY || ""
  const subject =
    process.env.WEB_PUSH_SUBJECT || "mailto:notificacoes@fortalstore.com"

  return {
    publicKey,
    privateKey,
    subject,
  }
}

export function isWebPushConfigured() {
  const { publicKey, privateKey } = getPushConfig()
  return Boolean(publicKey && privateKey)
}

function ensureWebPushConfigured() {
  const config = getPushConfig()

  if (!config.publicKey || !config.privateKey) {
    throw new Error("Web Push nao configurado no ambiente.")
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  return config
}

export function getWebPushPublicKey() {
  return getPushConfig().publicKey
}

function buildOrderPushPayload(order: Order) {
  return JSON.stringify({
    title: "Novo pedido na Fortal Store",
    body: `${order.customer.name} enviou um pedido de R$ ${order.totalPrice
      .toFixed(2)
      .replace(".", ",")}.`,
    tag: `order-${order.id}`,
    orderId: order.id,
    url: "/admin",
  })
}

export async function sendNewOrderPushNotifications(order: Order) {
  if (!isWebPushConfigured()) {
    return
  }

  ensureWebPushConfigured()

  const subscriptions = await getPushSubscriptions()

  await Promise.all(
    subscriptions.map(async (record) => {
      try {
        await webpush.sendNotification(
          record.subscription,
          buildOrderPushPayload(order)
        )
      } catch (error) {
        const pushError = error as { statusCode?: number }

        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          await removePushSubscription(record.subscription.endpoint)
          return
        }

        console.error("[web-push] Error sending push notification:", error)
      }
    })
  )
}
