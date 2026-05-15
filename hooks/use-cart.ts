"use client"

import { useEffect, useState } from "react"
import type { CartItem, Product } from "@/lib/types"

const STORAGE_KEY = "fortal-store-cart"
const DEFAULT_SIZE = "Unico"

function createCartItem(product: Product, size: string): CartItem {
  return {
    id: `${product.id}:${size}`,
    productId: product.id,
    name: product.name,
    team: product.team,
    price: product.price,
    imageUrl: product.imageUrl,
    size,
    quantity: 1,
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      if (stored) {
        const parsed = JSON.parse(stored)

        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error)
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error)
    }
  }, [items, isReady])

  function addToCart(product: Product, size?: string) {
    const selectedSize = size || product.sizes[0] || DEFAULT_SIZE
    const nextItem = createCartItem(product, selectedSize)

    setItems((current) => {
      const existingItem = current.find((item) => item.id === nextItem.id)

      if (!existingItem) {
        return [...current, nextItem]
      }

      return current.map((item) =>
        item.id === nextItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    })
  }

  function updateQuantity(itemId: string, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== itemId)
      }

      return current.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    })
  }

  function removeFromCart(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )

  return {
    items,
    isReady,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }
}
