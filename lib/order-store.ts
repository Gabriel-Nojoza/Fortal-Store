import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import {
  ensureSupabaseAvailable,
  insertRow,
  selectRows,
  shouldUseSupabaseStorage,
  updateRows,
} from "@/lib/supabase-rest"
import type { CartItem, Order, OrderStatus } from "@/lib/types"

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json")

interface OrderRow {
  id: string
  customer: Order["customer"]
  payment_method: Order["paymentMethod"]
  delivery_method: Order["deliveryMethod"]
  address: Order["address"]
  notes: string
  items: CartItem[]
  total_items: number
  total_price: number | string
  status: OrderStatus
  created_at: string
}

function mapOrderRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customer: row.customer,
    paymentMethod: row.payment_method,
    deliveryMethod: row.delivery_method,
    address: row.address,
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items : [],
    totalItems: row.total_items,
    totalPrice: Number(row.total_price),
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapOrderToRow(order: Order): OrderRow {
  return {
    id: order.id,
    customer: order.customer,
    payment_method: order.paymentMethod,
    delivery_method: order.deliveryMethod,
    address: order.address,
    notes: order.notes,
    items: order.items,
    total_items: order.totalItems,
    total_price: order.totalPrice,
    status: order.status,
    created_at: order.createdAt,
  }
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

async function readOrdersFromSupabase() {
  ensureSupabaseAvailable()

  const rows = await selectRows<OrderRow>("orders", {
    orderBy: {
      column: "created_at",
      ascending: false,
    },
  })

  return rows.map(mapOrderRowToOrder)
}

async function readOrders() {
  if (shouldUseSupabaseStorage()) {
    return readOrdersFromSupabase()
  }

  return readOrdersFromFile()
}

export async function getOrders() {
  const orders = await readOrders()
  return sortOrdersByDate(orders)
}

export async function createOrder(orderData: Omit<Order, "id" | "createdAt">) {
  const newOrder: Order = {
    ...orderData,
    id: `PED-${randomUUID().split("-")[0].toUpperCase()}`,
    createdAt: new Date().toISOString(),
  }

  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const createdRow = await insertRow<OrderRow>("orders", mapOrderToRow(newOrder))
    return createdRow ? mapOrderRowToOrder(createdRow) : newOrder
  }

  const orders = await readOrdersFromFile()
  orders.unshift(newOrder)
  await writeOrdersToFile(orders)

  return newOrder
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const updatedRows = await updateRows<OrderRow>(
      "orders",
      {
        status,
      },
      [
        {
          column: "id",
          value: id,
        },
      ]
    )

    return updatedRows[0] ? mapOrderRowToOrder(updatedRows[0]) : null
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
