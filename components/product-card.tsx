"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product, size: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const sizeOptions = useMemo(
    () =>
      product.sizes.length > 0
        ? product.sizes
        : [{ size: "Unico", quantity: 1 }],
    [product.sizes]
  )
  const firstInStock = sizeOptions.find((s) => s.quantity > 0)
  const [selectedSize, setSelectedSize] = useState(
    firstInStock?.size ?? sizeOptions[0]?.size ?? "Unico"
  )

  return (
    <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.imageUrl.startsWith("data:") ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        <Badge 
          className="absolute left-3 top-3 bg-primary text-primary-foreground"
        >
          {product.team}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-accent">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          <Badge variant="outline">Tam. {selectedSize}</Badge>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Escolha o tamanho
          </p>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map(({ size, quantity }) => {
              const isSelected = size === selectedSize
              const isOutOfStock = quantity === 0

              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && setSelectedSize(size)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isOutOfStock
                      ? "cursor-not-allowed border-border/40 bg-secondary/50 text-muted-foreground/40 line-through"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          disabled={sizeOptions.find((s) => s.size === selectedSize)?.quantity === 0}
          onClick={() => onAddToCart?.(product, selectedSize)}
        >
          <ShoppingCart className="h-4 w-4" />
          {sizeOptions.find((s) => s.size === selectedSize)?.quantity === 0
            ? "Esgotado"
            : "Adicionar ao carrinho"}
        </Button>
      </CardContent>
    </Card>
  )
}
