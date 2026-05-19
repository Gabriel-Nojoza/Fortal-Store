"use client"

import { Pencil, Trash2, Package } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  isDeleting: string | null
}

export function ProductList({
  products,
  onEdit,
  onDelete,
  isDeleting,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            Nenhum produto cadastrado
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione seu primeiro produto acima.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5 text-primary" />
          Produtos Cadastrados ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-4"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                {product.imageUrl.startsWith("data:") ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-foreground">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {product.team}
                  </Badge>
                  <span className="text-sm font-semibold text-accent">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="mt-1 flex gap-1">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  className="text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label={`Editar ${product.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(product.id)}
                  disabled={isDeleting === product.id}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Excluir ${product.name}`}
                >
                  {isDeleting === product.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
