import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import type { Order, OrderStatus } from "@/lib/types"

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json")

async function writeOrders(orders: Order[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
}

async function readOrders() {
  try {
    const contents = await fs.readFile(ORDERS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writeOrders([])
      return []
    }

    throw error
  }
}

function sortOrdersByDate(orders: Order[]) {
  return [...orders].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export async function getOrders() {
  const orders = await readOrders()
  return sortOrdersByDate(orders)
}

export async function createOrder(
  orderData: Omit<Order, "id" | "createdAt">
) {
  const orders = await readOrders()

  const newOrder: Order = {
    ...orderData,
    id: `PED-${randomUUID().split("-")[0].toUpperCase()}`,
    createdAt: new Date().toISOString(),
  }

  orders.unshift(newOrder)
  await writeOrders(orders)

  return newOrder
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = await readOrders()
  const orderIndex = orders.findIndex((order) => order.id === id)

  if (orderIndex === -1) {
    return null
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    status,
  }

  await writeOrders(orders)
  return orders[orderIndex]
}
