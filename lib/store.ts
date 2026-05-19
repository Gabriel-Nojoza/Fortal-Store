import { promises as fs } from "fs"
import path from "path"
import {
  deleteJsonRecord,
  ensureServerStorageAvailable,
  isBlobStorageEnabled,
  listJsonRecords,
  putJsonRecord,
  readJsonRecord,
} from "@/lib/blob-json-store"
import type { Product } from "@/lib/types"

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json")
const PRODUCTS_BLOB_PREFIX = "products/"

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Camisa Fortaleza Home 2024",
    description:
      "Camisa oficial do Fortaleza Esporte Clube para a temporada 2024. Material de alta qualidade com tecnologia de absorcao de suor.",
    price: 299.9,
    imageUrl: "/uploads/fortaleza-home.jpg",
    sizes: ["P", "M", "G", "GG"],
    team: "Fortaleza",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Camisa Flamengo Away 2024",
    description:
      "Camisa reserva do Flamengo para a temporada 2024. Design exclusivo em branco com detalhes em vermelho e preto.",
    price: 319.9,
    imageUrl: "/uploads/flamengo-away.jpg",
    sizes: ["P", "M", "G", "GG", "XGG"],
    team: "Flamengo",
    createdAt: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    name: "Camisa Ceara Titular 2024",
    description:
      "Camisa principal do Ceara Sporting Club. Tradicional listrada em preto e branco.",
    price: 279.9,
    imageUrl: "/uploads/ceara-home.jpg",
    sizes: ["M", "G", "GG"],
    team: "Ceara",
    createdAt: "2024-01-17T10:00:00Z",
  },
]

function getProductBlobPath(id: string) {
  return `${PRODUCTS_BLOB_PREFIX}${id}.json`
}

function sortProducts(products: Product[]) {
  return [...products].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
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
        // Read-only environments such as Vercel can still serve the fallback data.
      }
      return sortProducts(initialProducts)
    }

    console.error("[products] Falling back to bundled defaults:", error)
    return sortProducts(initialProducts)
  }
}

async function readProducts() {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    try {
      const products = await listJsonRecords<Product>(PRODUCTS_BLOB_PREFIX)

      if (products.length > 0) {
        return sortProducts(products)
      }
    } catch (error) {
      console.error("[products] Falling back to file storage:", error)
    }
  }

  return readProductsFromFile()
}

export async function getProducts() {
  return readProducts()
}

export async function getProduct(id: string) {
  const products = await readProducts()
  return products.find((product) => product.id === id)
}

export async function addProduct(product: Product) {
  ensureServerStorageAvailable("write")

  if (isBlobStorageEnabled()) {
    await putJsonRecord(getProductBlobPath(product.id), product)
    return
  }

  const products = await readProductsFromFile()
  products.unshift(product)
  await writeProductsToFile(products)
}

export async function deleteProduct(id: string) {
  ensureServerStorageAvailable("write")

  if (isBlobStorageEnabled()) {
    return deleteJsonRecord(getProductBlobPath(id))
  }

  const products = await readProductsFromFile()
  const nextProducts = products.filter((product) => product.id !== id)

  if (nextProducts.length === products.length) {
    return false
  }

  await writeProductsToFile(nextProducts)
  return true
}

export async function updateProduct(id: string, product: Product) {
  ensureServerStorageAvailable("write")

  if (isBlobStorageEnabled()) {
    await readProducts()
    const currentProduct = await readJsonRecord<Product>(getProductBlobPath(id))

    if (!currentProduct) {
      return false
    }

    await putJsonRecord(getProductBlobPath(id), product)
    return true
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
