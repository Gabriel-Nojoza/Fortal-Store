import { promises as fs } from "fs"
import path from "path"
import type { Product } from "@/lib/types"

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json")

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Camisa Fortaleza Home 2024",
    description:
      "Camisa oficial do Fortaleza Esporte Clube para a temporada 2024. Material de alta qualidade com tecnologia de absorção de suor.",
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
    name: "Camisa Ceará Titular 2024",
    description:
      "Camisa principal do Ceará Sporting Club. Tradicional listrada em preto e branco.",
    price: 279.9,
    imageUrl: "/uploads/ceara-home.jpg",
    sizes: ["M", "G", "GG"],
    team: "Ceará",
    createdAt: "2024-01-17T10:00:00Z",
  },
]

async function writeProducts(products: Product[]) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8")
}

async function readProducts() {
  try {
    const contents = await fs.readFile(PRODUCTS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed) ? (parsed as Product[]) : initialProducts
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writeProducts(initialProducts)
      return initialProducts
    }

    throw error
  }
}

export async function getProducts() {
  return readProducts()
}

export async function getProduct(id: string) {
  const products = await readProducts()
  return products.find((product) => product.id === id)
}

export async function addProduct(product: Product) {
  const products = await readProducts()
  products.unshift(product)
  await writeProducts(products)
}

export async function deleteProduct(id: string) {
  const products = await readProducts()
  const nextProducts = products.filter((product) => product.id !== id)

  if (nextProducts.length === products.length) {
    return false
  }

  await writeProducts(nextProducts)
  return true
}

export async function updateProduct(id: string, product: Product) {
  const products = await readProducts()
  const index = products.findIndex((item) => item.id === id)

  if (index === -1) {
    return false
  }

  products[index] = product
  await writeProducts(products)
  return true
}
