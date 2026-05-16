import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { createOrderNote, getOrderNotes } from "@/lib/order-notes-store"

const createOrderNoteSchema = z.object({
  orderId: z.string().trim().min(1, "Selecione um pedido."),
  customerName: z.string().trim().min(1, "Cliente invalido."),
  content: z
    .string()
    .trim()
    .min(3, "Digite a anotacao do pedido.")
    .max(1000, "A anotacao ficou muito longa."),
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

    const notes = await getOrderNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error("[order-notes] Error getting notes:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao carregar anotacoes." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = createOrderNoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Dados da anotacao invalidos.",
        },
        { status: 400 }
      )
    }

    const note = await createOrderNote(parsed.data)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("[order-notes] Error creating note:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao salvar anotacao." },
      { status: 500 }
    )
  }
}
