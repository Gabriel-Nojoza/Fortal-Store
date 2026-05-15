import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  team: z.string(),
  price: z.number().positive(),
  imageUrl: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
})

const requestSchema = z.object({
  items: z.array(cartItemSchema).min(1),
})

function getAbsoluteImageUrl(origin: string, imageUrl: string) {
  if (!imageUrl || imageUrl.startsWith("data:")) {
    return undefined
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }

  return `${origin}${imageUrl}`
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago não configurado. Preencha MERCADO_PAGO_ACCESS_TOKEN no ambiente.",
      },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { items } = requestSchema.parse(body)

    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL

    const preferencePayload = {
      items: items.map((item) => ({
        id: item.productId,
        title: item.name,
        description: `${item.team} - Tamanho ${item.size}`,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: Number(item.price.toFixed(2)),
        picture_url: getAbsoluteImageUrl(origin, item.imageUrl),
      })),
      back_urls: {
        success: `${origin}/pagamento/sucesso`,
        pending: `${origin}/pagamento/pendente`,
        failure: `${origin}/pagamento/falha`,
      },
      auto_return: "approved",
      external_reference: `fortal-${randomUUID()}`,
      notification_url: notificationUrl || undefined,
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(preferencePayload),
      }
    )

    if (!response.ok) {
      const errorPayload = await response.text()
      console.error("Mercado Pago error:", errorPayload)

      return NextResponse.json(
        {
          error:
            "Não foi possível iniciar o pagamento no Mercado Pago. Verifique as credenciais e tente novamente.",
        },
        { status: 502 }
      )
    }

    const preference = await response.json()
    const useSandbox = process.env.MERCADO_PAGO_USE_SANDBOX === "true"
    const checkoutUrl = useSandbox
      ? preference.sandbox_init_point || preference.init_point
      : preference.init_point || preference.sandbox_init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Mercado Pago não retornou um link de checkout." },
        { status: 502 }
      )
    }

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error("Erro ao criar checkout Mercado Pago:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Itens do carrinho inválidos para checkout." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno ao iniciar checkout." },
      { status: 500 }
    )
  }
}
