"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Order, OrderStatus } from "@/lib/types"

const POLLING_INTERVAL = 5000

async function requestOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders", {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error || "Erro ao carregar pedidos")
  }

  return response.json()
}

interface UseOrdersResult {
  orders: Order[]
  isLoading: boolean
  newOrderCount: number
  refreshOrders: () => Promise<void>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  markOrderAsSeen: (id: string) => Promise<void>
}

export function useOrders(
  enabled = true,
  onNewOrders?: (orders: Order[]) => void
): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const knownOrderIdsRef = useRef<string[]>([])
  const hasLoadedRef = useRef(false)
  const onNewOrdersRef = useRef(onNewOrders)

  useEffect(() => {
    onNewOrdersRef.current = onNewOrders
  }, [onNewOrders])

  const refreshOrders = useCallback(async () => {
    if (!enabled) {
      setOrders([])
      setIsLoading(false)
      hasLoadedRef.current = false
      knownOrderIdsRef.current = []
      return
    }

    try {
      const nextOrders = await requestOrders()

      if (hasLoadedRef.current) {
        const knownOrderIds = new Set(knownOrderIdsRef.current)
        const incomingOrders = nextOrders.filter(
          (order) => !knownOrderIds.has(order.id)
        )

        if (incomingOrders.length > 0) {
          onNewOrdersRef.current?.(incomingOrders)
        }
      }

      knownOrderIdsRef.current = nextOrders.map((order) => order.id)
      hasLoadedRef.current = true
      setOrders(nextOrders)
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setOrders([])
      setIsLoading(false)
      hasLoadedRef.current = false
      knownOrderIdsRef.current = []
      return
    }

    setIsLoading(true)
    void refreshOrders()

    const intervalId = window.setInterval(() => {
      void refreshOrders()
    }, POLLING_INTERVAL)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, refreshOrders])

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Erro ao atualizar pedido")
      }

      const updatedOrder = (await response.json()) as Order

      setOrders((current) =>
        current.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      )
    },
    []
  )

  const newOrderCount = orders.filter((order) => order.status === "novo").length

  return {
    orders,
    isLoading,
    newOrderCount,
    refreshOrders,
    updateOrderStatus,
    markOrderAsSeen: (id: string) => updateOrderStatus(id, "visualizado"),
  }
}
