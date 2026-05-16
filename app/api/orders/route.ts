import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { createOrder, getOrders } from "@/lib/order-store"
import { getProducts } from "@/lib/store"
import { sendNewOrderPushNotifications } from "@/lib/web-push"
import type { CartItem } from "@/lib/types"

const orderSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, "Informe o nome do cliente."),
      whatsapp: z.string().trim().min(8, "Informe um WhatsApp valido."),
    }),
    paymentMethod: z.enum(["pix", "cartao"]),
    deliveryMethod: z.enum(["moto-uber", "retirada"]),
    address: z
      .object({
        street: z.string().trim().min(2, "Informe a rua."),
        number: z.string().trim().min(1, "Informe o numero."),
        neighborhood: z.string().trim().min(2, "Informe o bairro."),
        reference: z.string().trim().max(200).optional().default(""),
      })
      .nullable(),
    notes: z.string().trim().max(400).optional().default(""),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          size: z.string().min(1),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, "Adicione pelo menos um item ao pedido."),
  })
  .superRefine((data, context) => {
    if (data.deliveryMethod === "moto-uber" && !data.address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o endereco para entrega.",
        path: ["address"],
      })
    }
  })

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    const orders = await getOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error("[orders] Error getting orders:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao carregar pedidos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dados do pedido invalidos. Revise e tente novamente.",
        },
        { status: 400 }
      )
    }

    const products = await getProducts()
    const productMap = new Map(products.map((product) => [product.id, product]))
    const orderItems: CartItem[] = []

    for (const incomingItem of parsed.data.items) {
      const product = productMap.get(incomingItem.productId)

      if (!product) {
        return NextResponse.json(
          { error: "Um dos produtos nao existe mais no catalogo." },
          { status: 400 }
        )
      }

      const hasSize =
        product.sizes.length === 0 ||
        product.sizes.includes(incomingItem.size) ||
        incomingItem.size === "Unico"

      if (!hasSize) {
        return NextResponse.json(
          {
            error: `O tamanho ${incomingItem.size} nao esta disponivel para ${product.name}.`,
          },
          { status: 400 }
        )
      }

      orderItems.push({
        id: `${product.id}:${incomingItem.size}`,
        productId: product.id,
        name: product.name,
        team: product.team,
        price: product.price,
        imageUrl: product.imageUrl,
        size: incomingItem.size,
        quantity: incomingItem.quantity,
      })
    }

    const totalItems = orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    )
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    )

    const order = await createOrder({
      customer: parsed.data.customer,
      paymentMethod: parsed.data.paymentMethod,
      deliveryMethod: parsed.data.deliveryMethod,
      address:
        parsed.data.deliveryMethod === "moto-uber"
          ? parsed.data.address
          : null,
      notes: parsed.data.notes || "",
      items: orderItems,
      totalItems,
      totalPrice,
      status: "novo",
    })

    try {
      await sendNewOrderPushNotifications(order)
    } catch (error) {
      console.error("[orders] Error sending push notifications:", error)
    }

    return NextResponse.json(
      {
        orderId: order.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[orders] Error creating order:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao enviar pedido" },
      { status: 500 }
    )
  }
}
