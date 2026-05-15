import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { updateOrderStatus } from "@/lib/order-store"

const statusSchema = z.object({
  status: z.enum(["novo", "visualizado"]),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Status do pedido invalido." },
        { status: 400 }
      )
    }

    const order = await updateOrderStatus(id, parsed.data.status)

    if (!order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado." },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("[orders] Error updating order:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    )
  }
}
