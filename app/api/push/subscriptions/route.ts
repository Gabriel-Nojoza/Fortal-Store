import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import {
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push-subscription-store"
import { isWebPushConfigured } from "@/lib/web-push"

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

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
      return NextResponse.json(
        { error: "Dados de notificacao invalidos." },
        { status: 400 }
      )
    }

    await savePushSubscription(parsed.data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[push] Error saving subscription:", error)
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
    return NextResponse.json(
      { error: "Erro ao desativar notificacoes push." },
      { status: 500 }
    )
  }
}
