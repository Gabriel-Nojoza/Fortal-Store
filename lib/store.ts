import { promises as fs } from "fs"
import path from "path"
import {
  deleteRows,
  ensureSupabaseAvailable,
  insertRow,
  selectRows,
  shouldUseSupabaseStorage,
  updateRows,
} from "@/lib/supabase-rest"
import type { Product, SizeStock } from "@/lib/types"

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json")

const initialProducts: Product[] = []

interface ProductRow {
  id: string
  name: string
  team: string
  price: number | string
  description: string
  sizes: (SizeStock | string)[]
  image_url: string
  created_at: string
}

function normalizeSizes(raw: (SizeStock | string)[]): SizeStock[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  if (typeof raw[0] === "object" && raw[0] !== null && "size" in raw[0]) {
    return raw as SizeStock[]
  }
  return (raw as string[]).map((size) => ({ size, quantity: 0 }))
}

function sortProducts(products: Product[]) {
  return [...products].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

function mapProductRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    team: row.team,
    price: Number(row.price),
    description: row.description,
    sizes: normalizeSizes(row.sizes),
    imageUrl: row.image_url,
    createdAt: row.created_at,
  }
}

function mapProductToRow(product: Product): ProductRow {
  return {
    id: product.id,
    name: product.name,
    team: product.team,
    price: product.price,
    description: product.description,
    sizes: product.sizes,
    image_url: product.imageUrl,
    created_at: product.createdAt,
  }
}

async function writeProductsToFile(products: Product[]) {
  await fs.mkdir(path.dirname(PRODUCTS_FILE), { recursive: true })
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8")
}

async function readProductsFromFile() {
  try {
    const contents = await fs.readFile(PRODUCTS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed)
      ? sortProducts(parsed as Product[])
      : sortProducts(initialProducts)
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      try {
        await writeProductsToFile(initialProducts)
      } catch {
        // Ignore local write failures during development bootstrap.
      }

      return sortProducts(initialProducts)
    }

    console.error("[products] Falling back to bundled defaults:", error)
    return sortProducts(initialProducts)
  }
}

async function readProductsFromSupabase() {
  ensureSupabaseAvailable()

  const rows = await selectRows<ProductRow>("products", {
    orderBy: {
      column: "created_at",
      ascending: false,
    },
  })

  return rows.map(mapProductRowToProduct)
}

async function readProducts() {
  if (shouldUseSupabaseStorage()) {
    return readProductsFromSupabase()
  }

  return readProductsFromFile()
}

export async function getProducts() {
  return readProducts()
}

export async function getProduct(id: string) {
  if (shouldUseSupabaseStorage()) {
    const rows = await selectRows<ProductRow>("products", {
      filters: [
        {
          column: "id",
          value: id,
        },
      ],
      limit: 1,
    })

    return rows[0] ? mapProductRowToProduct(rows[0]) : undefined
  }

  const products = await readProductsFromFile()
  return products.find((product) => product.id === id)
}

export async function addProduct(product: Product) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")
    await insertRow<ProductRow>("products", mapProductToRow(product))
    return
  }

  const products = await readProductsFromFile()
  products.unshift(product)
  await writeProductsToFile(products)
}

export async function deleteProduct(id: string) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const deletedRows = await deleteRows<ProductRow>("products", [
      {
        column: "id",
        value: id,
      },
    ])

    return deletedRows.length > 0
  }

  const products = await readProductsFromFile()
  const nextProducts = products.filter((product) => product.id !== id)

  if (nextProducts.length === products.length) {
    return false
  }

  await writeProductsToFile(nextProducts)
  return true
}

export async function deductStock(
  productId: string,
  size: string,
  quantity: number
) {
  const product = await getProduct(productId)
  if (!product) return

  const idx = product.sizes.findIndex((s) => s.size === size)
  if (idx === -1) return

  const updatedSizes = [...product.sizes]
  updatedSizes[idx] = {
    ...updatedSizes[idx],
    quantity: Math.max(0, updatedSizes[idx].quantity - quantity),
  }

  await updateProduct(productId, { ...product, sizes: updatedSizes })
}

export async function updateProduct(id: string, product: Product) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const updatedRows = await updateRows<ProductRow>(
      "products",
      mapProductToRow(product),
      [
        {
          column: "id",
          value: id,
        },
      ]
    )

    return updatedRows.length > 0
  }

  const products = await readProductsFromFile()
  const index = products.findIndex((item) => item.id === id)

  if (index === -1) {
    return false
  }

  products[index] = product
  await writeProductsToFile(products)
  return true
}
