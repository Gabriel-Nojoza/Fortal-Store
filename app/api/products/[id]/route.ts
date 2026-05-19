import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { deleteProduct, getProduct, updateProduct } from "@/lib/store"
import type { Product } from "@/lib/types"

function normalizeProductPayload(body: Record<string, unknown>) {
  const name = String(body.name || "").trim()
  const team = String(body.team || "").trim()
  const description = String(body.description || "").trim()
  const imageUrl = String(body.imageUrl || "").trim()
  const price = Number(body.price)
  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .map((size) => String(size).trim())
        .filter(Boolean)
    : []

  if (!name || !team || !description || !imageUrl) {
    throw new Error("Preencha nome, time, descricao e imagem do produto.")
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Informe um preco valido para o produto.")
  }

  if (sizes.length === 0) {
    throw new Error("Selecione pelo menos um tamanho para o produto.")
  }

  return {
    name,
    team,
    price,
    description,
    sizes,
    imageUrl,
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso nao autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const currentProduct = await getProduct(id)

    if (!currentProduct) {
      return NextResponse.json(
        { error: "Produto nao encontrado" },
        { status: 404 }
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const payload = normalizeProductPayload(body)

    const nextProduct: Product = {
      ...currentProduct,
      ...payload,
    }

    const updated = await updateProduct(id, nextProduct)

    if (!updated) {
      return NextResponse.json(
        { error: "Produto nao encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(nextProduct)
  } catch (error) {
    console.error("[v0] Error updating product:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const deleted = await deleteProduct(id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    )
  }
}
