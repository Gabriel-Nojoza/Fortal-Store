import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import {
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push-subscription-store"
import { isWebPushConfigured } from "@/lib/web-push"

const subscriptionSchema = z
  .object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional().default(null),
    keys: z.object({
      p256dh: z.string().optional(),
      auth: z.string().optional(),
    }),
  })
  .superRefine((subscription, context) => {
    if (!subscription.keys.p256dh) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A assinatura push nao trouxe a chave p256dh.",
        path: ["keys", "p256dh"],
      })
    }

    if (!subscription.keys.auth) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A assinatura push nao trouxe a chave auth.",
        path: ["keys", "auth"],
      })
    }
  })
  .transform((subscription) => ({
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: subscription.keys.p256dh ?? "",
      auth: subscription.keys.auth ?? "",
    },
  }))

const subscribeSchema = z.object({
  subscription: subscriptionSchema,
  deviceName: z.string().trim().min(2).max(60).default("Admin device"),
  userAgent: z.string().trim().max(300).default(""),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Web Push nao configurado no servidor." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)

    if (!parsed.success) {
      console.error("[push] Invalid subscription payload:", parsed.error.flatten())
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Dados de notificacao invalidos.",
        },
        { status: 400 }
      )
    }

    await savePushSubscription(parsed.data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[push] Error saving subscription:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao ativar notificacoes push." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = unsubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Assinatura invalida." },
        { status: 400 }
      )
    }

    await removePushSubscription(parsed.data.endpoint)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[push] Error removing subscription:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao desativar notificacoes push." },
      { status: 500 }
    )
  }
}
