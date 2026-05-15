import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { addProduct, getProducts } from "@/lib/store"
import type { Product } from "@/lib/types"

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error getting products:", error)
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

    const body = await request.json()

    const newProduct: Product = {
      id: Date.now().toString(),
      name: body.name,
      team: body.team,
      price: body.price,
      description: body.description,
      sizes: body.sizes,
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString(),
    }

    await addProduct(newProduct)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}
