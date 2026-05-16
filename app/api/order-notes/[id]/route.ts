import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { deleteOrderNote } from "@/lib/order-notes-store"

export async function DELETE(
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
    const deleted = await deleteOrderNote(id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Anotacao nao encontrada." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[order-notes] Error deleting note:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao excluir anotacao." },
      { status: 500 }
    )
  }
}
