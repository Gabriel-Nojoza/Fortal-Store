import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { StorageConfigurationError } from "@/lib/blob-json-store"
import { addProduct, getProducts } from "@/lib/store"
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

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error getting products:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json(
      { error: "Erro ao carregar produtos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const payload = normalizeProductPayload(body)

    const newProduct: Product = {
      id: Date.now().toString(),
      ...payload,
      createdAt: new Date().toISOString(),
    }

    await addProduct(newProduct)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating product:", error)

    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}
