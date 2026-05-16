import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import {
  ensureServerStorageAvailable,
  isBlobStorageEnabled,
  listJsonRecords,
  putJsonRecord,
  readJsonRecord,
} from "@/lib/blob-json-store"
import type { Order, OrderStatus } from "@/lib/types"

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json")
const ORDERS_BLOB_PREFIX = "orders/"

function getOrderBlobPath(id: string) {
  return `${ORDERS_BLOB_PREFIX}${id}.json`
}

async function writeOrdersToFile(orders: Order[]) {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true })
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
}

async function readOrdersFromFile() {
  try {
    const contents = await fs.readFile(ORDERS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writeOrdersToFile([])
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

async function readOrders() {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    return listJsonRecords<Order>(ORDERS_BLOB_PREFIX)
  }

  return readOrdersFromFile()
}

export async function getOrders() {
  const orders = await readOrders()
  return sortOrdersByDate(orders)
}

export async function createOrder(orderData: Omit<Order, "id" | "createdAt">) {
  ensureServerStorageAvailable()

  const newOrder: Order = {
    ...orderData,
    id: `PED-${randomUUID().split("-")[0].toUpperCase()}`,
    createdAt: new Date().toISOString(),
  }

  if (isBlobStorageEnabled()) {
    await putJsonRecord(getOrderBlobPath(newOrder.id), newOrder)
    return newOrder
  }

  const orders = await readOrdersFromFile()
  orders.unshift(newOrder)
  await writeOrdersToFile(orders)

  return newOrder
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    const currentOrder = await readJsonRecord<Order>(getOrderBlobPath(id))

    if (!currentOrder) {
      return null
    }

    const updatedOrder: Order = {
      ...currentOrder,
      status,
    }

    await putJsonRecord(getOrderBlobPath(id), updatedOrder)
    return updatedOrder
  }

  const orders = await readOrdersFromFile()
  const orderIndex = orders.findIndex((order) => order.id === id)

  if (orderIndex === -1) {
    return null
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    status,
  }

  await writeOrdersToFile(orders)
  return orders[orderIndex]
}
