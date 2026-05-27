import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { getProduct, updateProduct } from "@/lib/store"
import type { Product, SizeStock } from "@/lib/types"

function normalizeStockPayload(body: Record<string, unknown>) {
  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .filter(
          (item): item is { size: string; quantity: number } =>
            item !== null &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).size === "string" &&
            typeof (item as Record<string, unknown>).quantity === "number"
        )
        .map((item) => ({
          size: String(item.size).trim(),
          quantity: Math.max(0, Math.floor(item.quantity)),
        }))
        .filter((item) => item.size)
    : []

  if (sizes.length === 0) {
    throw new Error("Informe pelo menos um tamanho para atualizar o estoque.")
  }

  return sizes
}

function mergeStocks(currentSizes: SizeStock[], nextSizes: SizeStock[]) {
  const nextQuantities = new Map(
    nextSizes.map(({ size, quantity }) => [size, quantity])
  )

  if (
    currentSizes.length !== nextSizes.length ||
    currentSizes.some(({ size }) => !nextQuantities.has(size))
  ) {
    throw new Error(
      "Para adicionar ou remover tamanhos, edite o produto na area de cadastro."
    )
  }

  return currentSizes.map(({ size }) => ({
    size,
    quantity: nextQuantities.get(size) ?? 0,
  }))
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
    const nextSizes = normalizeStockPayload(body)

    const nextProduct: Product = {
      ...currentProduct,
      sizes: mergeStocks(currentProduct.sizes, nextSizes),
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
    console.error("[v0] Error updating stock:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Erro ao atualizar estoque" },
      { status: 500 }
    )
  }
}
