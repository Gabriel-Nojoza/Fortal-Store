"use client"

import { useState, useEffect, useCallback } from "react"
import type { Product } from "@/lib/types"

async function requestProducts(): Promise<Product[]> {
  const response = await fetch("/api/products", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Erro ao carregar produtos")
  }

  return response.json()
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshProducts = useCallback(async () => {
    try {
      const nextProducts = await requestProducts()
      setProducts(nextProducts)
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProducts()
  }, [refreshProducts])

  const deleteProduct = useCallback(async (id: string) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || "Erro ao excluir produto")
    }

    setProducts((prev) => prev.filter((product) => product.id !== id))
  }, [])

  return {
    products,
    isLoading,
    deleteProduct,
    refreshProducts,
  }
}
